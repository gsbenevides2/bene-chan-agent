# Project Patterns

## Icons & Images

These rules are specific to this project. Whenever creating or editing UI components, follow these project-level conventions in addition to the framework-specific rules below.

- **Icons**: Always use [`lucide-react`](https://lucide.dev/) for icons. Import only the needed icon (e.g., `import { Send } from "lucide-react";`) and render it as a component (`<Send />`). Never use inline SVGs directly in components.
- **Images**: Always use the Next.js `<Image>` component from `next/image` instead of the native `<img>` tag. Configure `remotePatterns` in `next.config.ts` when loading external images. When using the `fill` prop, ensure the parent element has `position: relative`.

## Component Breakdown

- **Keep components small and focused**: Break down large components into smaller, reusable pieces. Each component should have a single responsibility. For example, a chat interface should be split into `ChatHeader`, `ChatMessageBubble`, `ChatMessageList`, and `ChatInputBar` instead of a single monolithic file.
- **Separate presentational and container logic**: Extract presentational components (like message bubbles, headers) from container components that manage state and data flow.

<!-- BEGIN:nextjs-agent-rules -->

## ElysiaJS Schema Definition
- For all API routes write schemas for body, response, params and query. Write using zod and write route details(sumary, description). And use .meta({description, title and exemple})
- Use folder structure of modules (index.ts. model.ts and service.ts) see chat folder as exemple.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
