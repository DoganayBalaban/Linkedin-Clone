export default function PostAction({ icon, text, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center">
      <span className="mr-1">{icon}</span>
      <span className="hidden sm:inline">{text}</span>
    </button>
  );
}
