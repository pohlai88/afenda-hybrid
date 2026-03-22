---
name: storybook-ai
description: >-
  Official Storybook AI workflow — MCP server, manifests, MCP toolsets (development,
  docs, testing), and documentation best practices. Use when writing or fixing stories,
  connecting agents to Storybook, using design-system components without guessing props,
  or running Storybook tests from an agent. Sources are linked inline.
---

# Storybook + AI (official knowledge)

Storybook’s AI features (manifests + MCP) are documented as **preview** and may change. **Docs and manifests for MCP are currently oriented to React**; other renderers are planned.

Primary sources (read for details and updates):

- [Using Storybook with AI](https://storybook.js.org/docs/ai)
- [MCP server overview](https://storybook.js.org/docs/ai/mcp/overview)
- [MCP server API](https://storybook.js.org/docs/ai/mcp/api)
- [Manifests](https://storybook.js.org/docs/ai/manifests)
- [Best practices for using Storybook with AI](https://storybook.js.org/docs/ai/best-practices)

## Install the official MCP addon

From the package that runs Storybook:

```bash
npx storybook add @storybook/addon-mcp
```

With the dev server running, the MCP endpoint is typically `http://localhost:6006/mcp` (port may differ). Opening that URL in a browser lists available tools and links to the manifest debugger.

**Version note:** `@storybook/addon-mcp` expects **Storybook ^9.1.16 or ^10.x** (see package peers). This repo’s `@afenda/ui` package uses Storybook 10.x with `@storybook/addon-mcp` registered in `.storybook/main.ts`.

## Point your agent at the MCP server

Official docs suggest:

```bash
npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project
```

([mcp-add](https://github.com/paoloricciuti/mcp-add) — CLI to register HTTP MCP servers.)  
Alternatively, configure your editor or agent’s MCP config manually (see agent docs).

## Agent instructions (template from Storybook docs)

Replace `your-project-sb-mcp` with the MCP server name you registered.

When working on UI components, use the `your-project-sb-mcp` MCP tools for Storybook knowledge before acting.

- **Do not guess design-system props.** Before using any prop on a documented component, confirm it via MCP.
- Call **`list-all-documentation`** for the component index.
- Call **`get-documentation`** for props, examples (first three stories), and remaining story index.
- Use only props that are documented or shown in example stories. If undocumented, ask the user rather than inferring from naming or other libraries.
- Call **`get-storybook-story-instructions`** before creating or updating stories so conventions stay current.
- Validate with **`run-story-tests`** when tests are set up.

Story names may not match prop names — always verify via docs or stories.

## MCP toolsets (official)

### Development

| Tool                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `get-storybook-story-instructions` | How to write useful stories, props to capture, interaction tests     |
| `preview-stories`                  | Previews in chat (if client supports MCP Apps) or links to Storybook |

### Docs

| Tool                          | Purpose                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `get-documentation`           | Full component doc: props, first three stories, index of rest |
| `get-documentation-for-story` | Full story + doc when `get-documentation` is not enough       |
| `list-all-documentation`      | Index of components and unattached docs                       |

### Testing

| Tool              | Purpose                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| `run-story-tests` | Run tests for stories; includes a11y results if configured; use for fix/retest loops |

Composition: with [Storybook composition](https://storybook.js.org/docs/sharing/storybook-composition), composed Storybooks that expose manifests are merged into MCP responses.

## Best practices (official summary)

**Stories**

- Prefer **one concept per story**; explain _why_, not only _what_.
- Avoid kitchen-sink stories that mix unrelated concepts (harder for agents to reuse).
- Manifests reflect the **rendered** result (args, decorators applied).

**Component docs**

- Use **JSDoc** on the component export: description, optional `@summary` (agents get summary or truncated description).
- Use **JSDoc on stories**: description / `@summary` for when to use that example.
- Prefer **`react-docgen-typescript`** for prop extraction (`reactDocgen` in TypeScript config) for richer prop info; use `react-docgen` if manifests are too slow.
- Document **props** in JSDoc on the prop types/interfaces.

**MDX docs**

- Unattached pages: put a **`summary` in `Meta`** so the manifest includes a useful blurb.
- Manifests are from **static analysis** of MDX — values not literal in source (e.g. mapped token lists) may be missing; put critical facts in the MDX text when agents need them.

**Manifest curation**

- Exclude noise with **`tags: ['!manifest']`** on stories, meta, or MDX `Meta` when content is not for agents (anti-patterns, human-only docs, deprecated components).

## Workflow reminders

1. Start Storybook before relying on MCP tools.
2. For “build UI with our kit”: docs toolset → compose → development toolset for stories → testing toolset to verify (including a11y if enabled).
3. Treat MCP + manifests as the **source of truth** for props and examples in this repo’s Storybook.
