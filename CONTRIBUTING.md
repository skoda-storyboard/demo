# Contributing to Project Helix

This project (like almost all of Project Helix) is an Open Development project and welcomes contributions from everyone who finds it useful or lacking.

## Code Of Conduct

This project adheres to the Adobe [code of conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to cstaub at adobe dot com.

## Contributor License Agreement

All third-party contributions to this project must be accompanied by a signed contributor license. This gives Adobe permission to redistribute your contributions as part of the project. [Sign our CLA](http://opensource.adobe.com/cla.html)! You only need to submit an Adobe CLA one time, so if you have submitted one previously, you are good to go!

## Things to Keep in Mind

This project uses a **commit then review** process, which means that for approved maintainers, changes can be merged immediately, but will be reviewed by others.

For other contributors, a maintainer of the project has to approve the pull request.

# Before You Contribute

* Check that there is an existing issue in GitHub issues
* Check if there are other pull requests that might overlap or conflict with your intended contribution

# How to Contribute

1. Fork the repository
2. Make some changes on a branch on your fork
3. Create a pull request from your branch

In your pull request, outline:

* What the changes intend
* How they change the existing code
* If (and what) they breaks
* Start the pull request with the GitHub issue ID, e.g. #123

Lastly, please follow the [pull request template](.github/pull_request_template.md) when submitting a pull request!

Each commit message that is not part of a pull request:

* Should contain the issue ID like `#123`
* Can contain the tag `[trivial]` for trivial changes that don't relate to an issue



## Coding Styleguides

We enforce a coding styleguide using `eslint`. As part of your build, run `npm run lint` to check if your code is conforming to the style guide. We do the same for every PR in our CI, so PRs will get rejected if they don't follow the style guide.

You can fix some of the issues automatically by running `npx eslint . --fix`.

# Frontend CSS Contribution Guidelines

All frontend contributions involving CSS, responsive layout, or UI
styling must follow:

`docs/guardrails/css-guidelines.md`

## Pull Request Expectations

Before submitting frontend styling changes:

-   Verify the implementation follows the three-layer architecture:
    fluid, intrinsic/adaptive, then behavioral breakpoints.
-   Confirm new breakpoints are driven by an actual layout transition
    rather than a device category.
-   Reuse existing design tokens and CSS variables before creating new
    ones.
-   Keep component-specific styles with the component.
-   Keep global CSS limited to truly global concerns.
-   Prefer Grid, Flexbox, intrinsic sizing, and container queries over
    unnecessary viewport media queries.
-   Avoid magic numbers, unnecessary fixed heights, excessive
    specificity, `!important`, and JavaScript-based layout calculations.
-   Test intermediate widths, not only named device sizes.
-   Verify keyboard focus, text scaling, localization/text expansion,
    RTL where applicable, and reduced-motion behavior.
-   Confirm the change does not introduce unintended overflow or layout
    shift.

AI-generated code is held to the same engineering standards as manually
authored code.

## Commit Message Format

This project uses a structured commit changelog format that should be used for every commit. Use `npm run commit` instead of your usual `git commit` to generate commit messages using a wizard.

```bash
# either add all changed files
$ git add -A
# or selectively add files
$ git add package.json
# then commit using the wizard
$ npm run commit
```

# How Contributions get Reviewed

One of the maintainers will look at the pull request within one week. Feedback on the pull request will be given in writing, in GitHub.

# Release Management

The project's committers will release to the [Adobe organization on npmjs.org](https://www.npmjs.com/org/adobe).
Please contact the [Adobe Open Source Advisory Board](https://git.corp.adobe.com/OpenSourceAdvisoryBoard/discuss/issues) to get access to the npmjs organization.

