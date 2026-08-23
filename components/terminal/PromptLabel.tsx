// OWNER: 04-terminal-shell.md — do not edit from another role
// Shared prompt string + colored rendering ("guest@adrian-azucena.dev:~$"), used by both
// CommandInput (the live prompt) and OutputLog (each historical entry's echoed prompt) so the two
// never drift out of sync. Segment colors (user/host/suffix) reuse existing design tokens —
// accent-warn / accent-success / text-primary — rather than introducing new ones.
export const PROMPT_USER = "guest";
export const PROMPT_HOST = "adrian-azucena.dev";
export const PROMPT_SUFFIX = ":~$";
export const PROMPT_TEXT = `${PROMPT_USER}@${PROMPT_HOST}${PROMPT_SUFFIX}`;

export default function PromptLabel() {
  return (
    <>
      <span className="text-accent-warn">{PROMPT_USER}</span>
      <span className="text-text-muted">@</span>
      <span className="text-accent-success">{PROMPT_HOST}</span>
      <span className="text-text-primary">{PROMPT_SUFFIX}</span>
    </>
  );
}
