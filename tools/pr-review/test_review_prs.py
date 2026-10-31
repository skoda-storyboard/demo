import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch


SPEC = importlib.util.spec_from_file_location("review_prs", Path(__file__).with_name("review_prs.py"))
launcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(launcher)

HEAD = "a" * 40
BASE = "b" * 40


def pr(number=123):
    return {
        "repository": "skoda-storyboard/demo", "number": number,
        "url": "https://github.com/skoda-storyboard/demo/pull/{}".format(number),
        "headRefOid": HEAD, "baseRefOid": BASE, "headRefName": "feature/review",
        "baseRefName": "release", "state": "OPEN", "isCrossRepository": False,
    }


class UrlTests(unittest.TestCase):
    def test_normalizes_pr_subpages_queries_and_fragments(self):
        for suffix in ("", "/", "/files#diff-test", "/commits?x=1", "/checks/"):
            self.assertEqual(
                launcher.parse_url("https://github.com/skoda-storyboard/demo/pull/123" + suffix),
                ("skoda-storyboard/demo", 123),
            )

    def test_rejects_non_github_urls_and_shell_input(self):
        for value in (
            "http://github.com/a/b/pull/1", "https://github.com.evil/a/b/pull/1",
            "https://user@github.com/a/b/pull/1", "https://github.com/a/b/pull/0",
            "https://github.com/a/b/pull/1;touch", "https://github.com/a/b/pull/1\n",
            "https://github.com/a/b/issues/1", "https://github.com/a/b/pull/1/files/extra",
        ):
            with self.subTest(value=value), self.assertRaises(launcher.LaunchError):
                launcher.parse_url(value)

    def test_duplicate_urls_rejected_before_commands(self):
        with patch.object(launcher, "command") as command, self.assertRaises(launcher.LaunchError):
            launcher.launch([
                "https://github.com/a/b/pull/1", "https://github.com/A/B/pull/1/files",
            ])
        command.assert_not_called()


class MetadataTests(unittest.TestCase):
    def test_rejects_closed_pr_and_invalid_sha(self):
        for updates in ({"state": "MERGED"}, {"headRefOid": "--upload-pack=bad"}, {"number": 124}):
            data = dict(pr(), **updates)
            with patch.object(launcher, "command_json", return_value=data):
                with self.assertRaises(launcher.LaunchError):
                    launcher.read_pr("gh", "skoda-storyboard/demo", 123, Path("/repo"))

    def test_pins_actual_base_including_fork_pr(self):
        data = dict(pr(), isCrossRepository=True)
        with patch.object(launcher, "command_json", return_value=data):
            result = launcher.read_pr("gh", "skoda-storyboard/demo", 123, Path("/repo"))
        prompt = launcher.review_prompt(result, Path("/checkout"), Path("/evidence"))
        self.assertIn(BASE + " (release)", prompt)
        self.assertIn("fork PR: True", prompt)
        self.assertIn("head AND base SHAs", prompt)
        self.assertIn("approval", prompt)

    def test_command_errors_are_explicit(self):
        failure = subprocess.CompletedProcess(["git"], 1, "", "authentication failed")
        with patch.object(launcher.subprocess, "run", return_value=failure):
            with self.assertRaisesRegex(launcher.LaunchError, "authentication failed"):
                launcher.command(["git", "fetch"])

    def test_prompt_uses_github_psi_results_instead_of_local_lighthouse(self):
        prompt = launcher.review_prompt(pr(), Path("/checkout"), Path("/evidence"))
        self.assertIn("Do not run local Lighthouse/PSI audits or call lighthouse_audit.", prompt)
        self.assertIn("gh pr checks 123 --repo skoda-storyboard/demo", prompt)
        self.assertIn("Confirm results apply to the pinned PR head SHA", prompt)
        self.assertIn("record check status and report links", prompt)
        self.assertIn("pending, failed,\nmissing, skipped, cancelled, inaccessible or stale", prompt)
        self.assertIn("do not fall back to a local audit", prompt)
        self.assertIn("do not infer coverage or invent scores", prompt)
        self.assertIn("mobile and 768/992/1080, real clicks/keys, heading outlines", prompt)
        self.assertNotIn("Lighthouse accessibility,", prompt)
        self.assertNotIn("stagger performance audits", prompt)

    def test_findings_stay_on_screen_until_user_approves_posting(self):
        prompt = launcher.review_prompt(pr(), Path("/checkout"), Path("/evidence"))
        self.assertIn("Show the review summary in this terminal only.", prompt)
        self.assertIn("Do not create review.md or any\nother local review report file.", prompt)
        self.assertNotIn("Save the final report", prompt)
        self.assertNotIn("/evidence/review.md", prompt)
        self.assertIn("P0 critical, P1 high, P2 medium,\nP3 low", prompt)
        self.assertIn("Show the exact\nproposed GitHub text, target PR/issue and action", prompt)
        self.assertIn("permission to review is not permission to post", prompt)
        self.assertIn("If permission is declined\nor absent", prompt)
        self.assertIn("make no GitHub write", prompt)
        self.assertIn("avoid stale or duplicate posts", prompt)
        self.assertIn("obtain fresh permission before posting", prompt)

    def test_review_only_prompt_prohibits_fixes_and_codebase_changes(self):
        prompt = launcher.review_prompt(pr(), Path("/checkout"), Path("/evidence"))
        self.assertIn("This session is strictly review-only.", prompt)
        self.assertIn("Do not fix findings or create, edit,\ndelete or rename any files", prompt)
        self.assertIn("source, tests, configuration,\nlockfiles and generated files", prompt)
        self.assertIn("Do not run auto-fix tools, formatters, code\ngenerators", prompt)
        self.assertIn("or project dependency installation", prompt)
        self.assertIn("Do not checkout branches, commit,\nstash, reset or revert changes", prompt)
        self.assertIn("Permission to post feedback never authorizes\ncode changes", prompt)
        self.assertIn("implementation requires a separate task", prompt)
        self.assertIn("only checks that do not rewrite the codebase", prompt)
        self.assertIn("blocked rather than modifying anything to make it run", prompt)
        self.assertNotIn("Do not modify code, install project dependencies or execute package scripts\n"
                         "without approval", prompt)

    def test_clean_review_recommends_approval_only_after_verified_checks(self):
        prompt = launcher.review_prompt(pr(), Path("/checkout"), Path("/evidence"))
        self.assertIn("If no issues are found, explicitly say so", prompt)
        self.assertIn("Recommend approval only when all required checks are verified", prompt)
        self.assertIn("including current AEM PSI results", prompt)
        self.assertIn("recommend not approving yet", prompt)
        self.assertIn("never\napprove or merge automatically", prompt)
        self.assertIn("explicit permission before submitting\nan approval review", prompt)

    def test_prompt_distinguishes_routine_and_sensitive_actions(self):
        prompt = launcher.review_prompt(pr(), Path("/checkout"), Path("/evidence"))
        self.assertIn("Do not ask again for those routine actions", prompt)
        self.assertIn("Keep /permissions in manual\nmode", prompt)
        self.assertIn("Non-allowlisted tools still need approval", prompt)
        self.assertIn("Arbitrary JavaScript via evaluate_script", prompt)
        self.assertIn("not admin pages, account changes, purchases or persistent\nform submissions", prompt)
        self.assertIn("A tool approval is not permission to post GitHub\nfeedback", prompt)


class PermissionTests(unittest.TestCase):
    def test_allowlist_is_scoped_to_named_tools_not_whole_servers(self):
        args = launcher.permission_arguments("pr-review-chrome")
        allowed = {arg.removeprefix("--allow-tool=") for arg in args
                   if arg.startswith("--allow-tool=")}
        for rule in (
            "shell(git diff)", "shell(gh pr checks)",
            "pr-review-chrome(get_css_styles)", "pr-review-chrome(click)",
            "github-mcp-server(pull_request_read)",
        ):
            self.assertIn(rule, allowed)
        for rule in (
            "shell", "shell(git:*)", "shell(gh:*)", "shell(gh api)", "shell(curl)",
            "shell(bash)", "shell(python3)", "shell(node)", "shell(npm)",
            "pr-review-chrome", "pr-review-chrome(evaluate_script)",
            "pr-review-chrome(upload_file)", "github-mcp-server",
            "shell(gh pr review)", "shell(gh pr comment)", "shell(gh issue create)",
        ):
            self.assertNotIn(rule, allowed)
        for flag in ("--allow-all", "--allow-all-tools", "--allow-all-paths",
                     "--allow-all-urls", "--assisted-approval", "--yolo"):
            self.assertNotIn(flag, args)
        self.assertEqual({arg for arg in args if arg.startswith("--allow-url=")}, {
            "--allow-url=https://github.com", "--allow-url=https://api.github.com",
        })

    def test_editing_and_common_git_mutations_are_denied(self):
        args = launcher.permission_arguments("pr-review-chrome")
        for rule in ("write", "shell(git push)", "shell(git reset)", "shell(git config)",
                     "shell(git checkout)", "pr-review-chrome(lighthouse_audit)"):
            self.assertIn("--deny-tool=" + rule, args)
            self.assertNotIn("--allow-tool=" + rule, args)
        allowed = {arg.removeprefix("--allow-tool=") for arg in args
                   if arg.startswith("--allow-tool=")}
        denied = {arg.removeprefix("--deny-tool=") for arg in args
                  if arg.startswith("--deny-tool=")}
        self.assertFalse(allowed & denied)


class McpTests(unittest.TestCase):
    def test_preserves_github_and_disables_other_servers_without_global_writes(self):
        listing = {"mcpServers": {
            "github-mcp-server": {}, "chrome-devtools": {}, "pixel-guard": {},
            "pr-review-chrome": {},
        }}
        with patch.object(launcher, "command_json", return_value=listing) as query:
            args = launcher.mcp_arguments("/bin/copilot", Path("/checkout"))
        query.assert_called_once_with(["/bin/copilot", "mcp", "list", "--json"], Path("/checkout"))
        self.assertEqual(args[:2], ["--enable-mcp-server", "github-mcp-server"])
        disabled = [args[i + 1] for i, arg in enumerate(args) if arg == "--disable-mcp-server"]
        self.assertEqual(disabled, ["chrome-devtools", "pixel-guard", "pr-review-chrome"])
        config = json.loads(args[-1])
        browser = config["mcpServers"]["pr-review-chrome-isolated"]
        self.assertIn("--isolated", browser["args"])
        self.assertNotIn("--autoConnect", browser["args"])
        self.assertNotIn("--allow-all", args)
        self.assertIn("--allow-tool=pr-review-chrome-isolated(get_css_styles)", args)
        self.assertNotIn("--allow-tool=chrome-devtools(get_css_styles)", args)

    def test_missing_github_or_unknown_schema_fails(self):
        for listing in ({"mcpServers": []}, {"mcpServers": {}}, {}):
            with patch.object(launcher, "command_json", return_value=listing):
                with self.assertRaises(launcher.LaunchError):
                    launcher.mcp_arguments("copilot", Path("/checkout"))


class PreparationTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("git"), "requires Git")
    def test_real_git_fetch_and_independent_detached_worktrees(self):
        with tempfile.TemporaryDirectory(prefix="git-review-test-") as temporary:
            root = Path(temporary)
            repo = root / "repository"
            repo.mkdir()
            real_command = launcher.command
            git = shutil.which("git")
            real_command([git, "init", "-q"], repo)
            fixture = repo / "fixture.txt"
            commits = []
            for content in ("base", "head"):
                fixture.write_text(content)
                real_command([git, "add", "fixture.txt"], repo)
                real_command([
                    git, "-c", "user.name=Launcher Test", "-c", "user.email=test@example.invalid",
                    "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null",
                    "commit", "-q", "-m",
                    content + "\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>",
                ], repo)
                commits.append(real_command([git, "rev-parse", "HEAD"], repo))
            reviews = root / "reviews"
            reviews.mkdir()

            def local_remote(args, cwd=None):
                if args[1:3] == ["fetch", "--no-tags"]:
                    args = args[:3] + [str(repo)] + args[4:]
                return real_command(args, cwd)

            with patch.object(launcher, "command", side_effect=local_remote), \
                    patch.object(launcher, "mcp_arguments", return_value=[]), \
                    contextlib.redirect_stdout(io.StringIO()):
                for number in (123, 124):
                    metadata = dict(pr(number), headRefOid=commits[1], baseRefOid=commits[0])
                    launcher.prepare_review(metadata, reviews, repo, {"git": git, "copilot": "/fake"})
            for number in (123, 124):
                checkout = reviews / "pr-{}".format(number) / "worktree"
                self.assertEqual(real_command([git, "rev-parse", "HEAD"], checkout), commits[1])
                self.assertEqual(real_command([git, "rev-parse", "--abbrev-ref", "HEAD"], checkout), "HEAD")
                self.assertEqual(real_command([git, "diff", commits[0] + "...HEAD", "--name-only"],
                                              checkout), "fixture.txt")
            self.assertEqual(real_command([git, "rev-parse", "HEAD"], repo), commits[1])
            self.assertEqual(real_command([git, "status", "--porcelain"], repo), "")

    def test_detached_exact_sha_fetch_and_quoted_runner(self):
        with tempfile.TemporaryDirectory(prefix="review ' space ") as temporary:
            root = Path(temporary)
            tools = {"git": "/bin/git", "copilot": "/bin/copilot"}
            with patch.object(launcher, "command", return_value=HEAD) as command, \
                    patch.object(launcher, "mcp_arguments", return_value=[]), \
                    contextlib.redirect_stdout(io.StringIO()):
                manifest = launcher.prepare_review(pr(), root, root, tools)
            calls = [call.args[0] for call in command.call_args_list]
            self.assertEqual(calls[0], [
                "/bin/git", "fetch", "--no-tags", "https://github.com/skoda-storyboard/demo.git",
                HEAD, BASE,
            ])
            self.assertEqual(calls[1][1:4], ["worktree", "add", "--detach"])
            self.assertEqual(calls[1][-1], HEAD)
            data = json.loads(manifest.read_text())
            self.assertEqual(data["pr"]["baseRefName"], "release")
            args = data["command"]
            self.assertEqual(args[args.index("--model") + 1], "gpt-6.1-sol")
            self.assertEqual(args[args.index("--reasoning-effort") + 1], "high")
            runner = manifest.with_name("launch.command")
            argv = shlex.split(runner.read_text().splitlines()[1])
            self.assertEqual(argv[-2:], ["--run-session", str(manifest)])
            self.assertTrue(os.access(runner, os.X_OK))
            self.assertTrue((manifest.parent / "evidence").is_dir())
            self.assertNotIn("GH_TOKEN", manifest.read_text())

    def test_generated_runner_actually_executes_with_quoted_paths(self):
        with tempfile.TemporaryDirectory(prefix="runner ' space ") as temporary:
            root = Path(temporary)
            fake_copilot = root / "fake copilot"
            fake_copilot.write_text(
                "#!/bin/sh\nkill -INT \"$PPID\"\nprintf 'fake CLI started\\n'\n"
                "printf '%s\\n' \"$@\"\nexit 0\n"
            )
            fake_copilot.chmod(0o700)
            tools = {"git": "/bin/git", "copilot": str(fake_copilot)}
            with patch.object(launcher, "command", return_value=HEAD), \
                    patch.object(launcher, "mcp_arguments", return_value=[]), \
                    contextlib.redirect_stdout(io.StringIO()):
                manifest = launcher.prepare_review(pr(), root, root, tools)
            (manifest.parent / "worktree").mkdir()
            result = subprocess.run(
                [str(manifest.with_name("launch.command"))],
                text=True, capture_output=True, timeout=10,
                env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"), check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("fake CLI started", result.stdout)
            self.assertIn("--model\ngpt-6.1-sol\n", result.stdout)
            self.assertIn("--reasoning-effort\nhigh\n", result.stdout)
            self.assertEqual(json.loads(manifest.with_name("status.json").read_text()),
                             {"state": "exited", "code": 0})


class LaunchTests(unittest.TestCase):
    def invoke(self, repo, extra=None, metadata=None, missing_flag=None):
        arguments = [
            "--repo", str(repo), "https://github.com/skoda-storyboard/demo/pull/123",
        ] + (extra or [])
        help_text = "--name --session-id --interactive --mode --add-dir --additional-mcp-config " \
                    "--disable-mcp-server --enable-mcp-server --allow-tool --deny-tool --allow-url " \
                    "--model --reasoning-effort"
        if missing_flag:
            help_text = help_text.replace(missing_flag, "")
        with patch.object(launcher.sys, "platform", "darwin"), \
                patch.object(launcher.shutil, "which", side_effect=lambda name: "/bin/" + name), \
                patch.object(launcher, "command", side_effect=[str(repo), help_text]), \
                patch.object(launcher, "command_json",
                             return_value={"nameWithOwner": "skoda-storyboard/demo"}), \
                patch.object(launcher, "read_pr", side_effect=metadata or [pr()]), \
                patch.object(launcher, "mcp_arguments", return_value=[]), \
                contextlib.redirect_stdout(io.StringIO()):
            return launcher.launch(arguments)

    def test_dry_run_does_not_prepare_or_open_anything(self):
        with tempfile.TemporaryDirectory() as temporary, \
                patch.object(launcher, "prepare_review") as prepare, \
                patch.object(launcher, "open_terminal") as open_terminal:
            repo = Path(temporary)
            before = list(repo.iterdir())
            self.assertEqual(self.invoke(repo, ["--dry-run"]), 0)
            self.assertEqual(list(repo.iterdir()), before)
            prepare.assert_not_called()
            open_terminal.assert_not_called()

    def test_missing_model_or_reasoning_support_fails_before_preparing_reviews(self):
        for flag in ("--model", "--reasoning-effort"):
            with self.subTest(flag=flag), tempfile.TemporaryDirectory() as temporary, \
                    patch.object(launcher, "prepare_review") as prepare, \
                    patch.object(launcher, "open_terminal") as open_terminal:
                with self.assertRaisesRegex(launcher.LaunchError, "lacks " + flag):
                    self.invoke(Path(temporary), ["--dry-run"], missing_flag=flag)
                prepare.assert_not_called()
                open_terminal.assert_not_called()

    def test_output_inside_repo_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            repo = Path(temporary)
            with self.assertRaisesRegex(launcher.LaunchError, "outside"):
                self.invoke(repo, ["--dry-run", "--output-dir", str(repo / "served")])

    def test_rechecks_head_and_base_before_opening_windows(self):
        for changes in ({"headRefOid": "c" * 40}, {"baseRefOid": "c" * 40}):
            with tempfile.TemporaryDirectory() as temporary:
                repo = Path(temporary) / "repo"
                repo.mkdir()
                with patch.object(launcher, "prepare_review", return_value=Path("session.json")), \
                        patch.object(launcher, "open_terminal") as open_terminal:
                    with self.assertRaisesRegex(launcher.LaunchError, "changed"):
                        self.invoke(repo, metadata=[pr(), dict(pr(), **changes)])
                    open_terminal.assert_not_called()

    def test_mixed_repository_is_rejected(self):
        with patch.object(launcher.shutil, "which", return_value="/tool"), \
                patch.object(launcher, "command", return_value="/repo"), \
                patch.object(launcher, "command_json", return_value={"nameWithOwner": "other/repo"}):
            with self.assertRaisesRegex(launcher.LaunchError, "checkout"):
                launcher.launch(["--dry-run", "https://github.com/skoda-storyboard/demo/pull/123"])


class TerminalTests(unittest.TestCase):
    @unittest.skipUnless(sys.platform == "darwin", "requires the macOS session runner")
    def test_running_review_lock_rejects_duplicate_session(self):
        import fcntl

        with tempfile.TemporaryDirectory() as temporary:
            manifest = Path(temporary) / "session.json"
            launcher.write_json(manifest, {})
            with manifest.with_name("runner.lock").open("w") as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                with patch.object(launcher.subprocess, "Popen") as popen:
                    with self.assertRaisesRegex(launcher.LaunchError, "already running"):
                        launcher.run_session(manifest)
                    popen.assert_not_called()

    @unittest.skipUnless(sys.platform == "darwin" and shutil.which("osacompile"),
                         "requires macOS AppleScript compiler")
    def test_terminal_applescript_compiles_without_opening_windows(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "terminal.applescript"
            source.write_text(launcher.TERMINAL_SCRIPT)
            result = subprocess.run(
                ["osacompile", "-o", str(source.with_suffix(".scpt")), str(source)],
                text=True, capture_output=True, timeout=20, check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_terminal_command_uses_argv_not_applescript_interpolation(self):
        with tempfile.TemporaryDirectory(prefix="quoted ' path ") as temporary:
            manifest = Path(temporary) / "session.json"
            launcher.write_json(manifest, {"name": 'review "test"'})
            launcher.write_json(manifest.with_name("status.json"), {"state": "running", "pid": os.getpid()})
            with patch.object(launcher, "command", return_value="42") as command, \
                    contextlib.redirect_stdout(io.StringIO()):
                launcher.open_terminal(manifest, "/usr/bin/osascript")
            args = command.call_args.args[0]
            self.assertEqual(args[:3], ["/usr/bin/osascript", "-e", launcher.TERMINAL_SCRIPT])
            self.assertEqual(shlex.split(args[3]), [str(manifest.with_name("launch.command"))])
            self.assertEqual(args[4], 'review "test"')

    def test_runner_forwards_no_serialized_tokens_and_reports_exit(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest = Path(temporary) / "session.json"
            launcher.write_json(manifest, {
                "pr": pr(), "worktree": temporary, "command": ["copilot"],
                "path": "/bin:/usr/bin", "copilot_home": "/custom/copilot",
            })
            process = Mock()
            process.pid = os.getpid()
            process.wait.return_value = 7
            process.__enter__ = Mock(return_value=process)
            process.__exit__ = Mock(return_value=False)
            previous_sigint = signal.getsignal(signal.SIGINT)
            with patch.object(launcher.subprocess, "Popen", return_value=process) as popen, \
                    contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(launcher.run_session(manifest), 7)
            environment = popen.call_args.kwargs["env"]
            self.assertEqual(environment["COPILOT_ALLOW_ALL"], "false")
            self.assertEqual(environment["COPILOT_ASSISTED_APPROVAL"], "false")
            self.assertEqual(environment["COPILOT_HOME"], "/custom/copilot")
            self.assertIs(signal.getsignal(signal.SIGINT), previous_sigint)
            self.assertEqual(json.loads(manifest.with_name("status.json").read_text()),
                             {"state": "exited", "code": 7})

    def test_startup_failure_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest = Path(temporary) / "session.json"
            launcher.write_json(manifest, {"name": "review"})
            launcher.write_json(manifest.with_name("status.json"), {"state": "exited", "code": 1})
            with patch.object(launcher, "command", return_value="42"):
                with self.assertRaisesRegex(launcher.LaunchError, "startup"):
                    launcher.open_terminal(manifest, "osascript")


if __name__ == "__main__":
    unittest.main()
