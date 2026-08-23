import Terminal from "@/components/terminal/Terminal";

// Single-page app (BUILD_PROMPT.md §2): the terminal viewport is the entire surface, every
// section renders as terminal output. Terminal itself (role 04) owns hash routing, boot sequence,
// command dispatch, etc. — this file only mounts it inside the skip-link landmark.
export default function Home() {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col p-2">
      <Terminal />
    </main>
  );
}
