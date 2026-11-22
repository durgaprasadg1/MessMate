/**
 * Re-mounts on every navigation, so the PAGE (not the sidebar) fades in softly.
 * Replaces the old AnimatePresence wrapper, which faded the whole screen -
 * sidebar included - to nothing on every click and felt like a reload.
 */
export default function Template({ children }) {
  return <div className="page-enter">{children}</div>;
}
