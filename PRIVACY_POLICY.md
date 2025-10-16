# Privacy Policy for Claude Usage Monitor

**Last Updated: October 16, 2025**

## Overview

Claude Usage Monitor is a browser extension that helps you monitor your Claude.ai usage limits. This privacy policy explains what data we collect, how we use it, and how we protect your privacy.

## Data Collection and Usage

### Authentication Information

**What we collect:**
- Browser session cookies for Claude.ai authentication

**Why we collect it:**
- To authenticate API requests to Claude.ai using your existing browser session
- To fetch your usage data without requiring separate login credentials

**How we use it:**
- Session cookies are automatically included when making API requests to `https://claude.ai/api/organizations/{organizationId}/usage`
- We do not store, transmit, or access your actual password
- Authentication is handled entirely through your browser's existing session

### Website Content

**What we collect:**
- Usage statistics data from Claude.ai API (JSON format)
- Organization ID (user-provided)

**Why we collect it:**
- To display your Claude.ai usage limits and statistics
- To calculate usage percentages and reset times

**How we use it:**
- Usage data is fetched from Claude.ai API and stored locally on your device
- Data is refreshed every 5 minutes to keep statistics up-to-date
- All data remains on your device and is never transmitted to external servers

### User Preferences

**What we collect:**
- UI settings (view mode, column count, pace indicator preferences)
- Last update timestamp

**Why we collect it:**
- To remember your display preferences
- To provide a personalized viewing experience

## Data Storage

All collected data is stored locally on your device using the browser's storage API:

- **Organization ID**: Stored locally to remember your configuration
- **Usage data**: Cached locally to reduce API calls and improve performance
- **UI preferences**: Stored locally to maintain your settings

**Important:** No data is transmitted to external servers, third-party services, or the extension developer.

## Data Sharing

We do not share, sell, rent, or trade any of your data with third parties. All data remains exclusively on your device.

## Data Security

- All data is stored locally within the browser's secure storage system
- API requests are made directly to Claude.ai over HTTPS
- No data is transmitted through intermediate servers
- No analytics or tracking services are used

## Permissions Explanation

### Storage Permission
Required to save your Organization ID, usage data, and UI preferences locally on your device.

### Host Permission (https://claude.ai/*)
Required to fetch usage statistics from Claude.ai's API using your existing browser session.

## Data Retention

- **Usage data**: Automatically refreshed every 5 minutes; old data is overwritten
- **Organization ID**: Stored until you manually remove it or uninstall the extension
- **UI preferences**: Stored until you uninstall the extension

## User Rights

You have the right to:
- **Access your data**: All stored data can be viewed in the browser's extension storage
- **Delete your data**: Uninstalling the extension removes all locally stored data
- **Opt-out**: Stop using the extension at any time by disabling or uninstalling it

## Children's Privacy

This extension is not directed at children under 13 years of age. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Third-Party Services

This extension interacts with:
- **Claude.ai**: To fetch usage statistics via their API
- Claude.ai's own privacy policy applies to data they collect: https://www.anthropic.com/privacy

## Contact Information

For questions or concerns about this privacy policy, please file an issue on [our GitHub repository](https://github.com/oov/claude-usage-monitor).

## Consent

By installing and using Claude Usage Monitor, you consent to this privacy policy.

