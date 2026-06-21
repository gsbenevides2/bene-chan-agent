interface ChatHeaderProps {
  name: string;
  model?: string | null;
}

export default function ChatHeader({ name, model }: ChatHeaderProps) {
  return (
    <div className="bg-base-200 border-base-300 border-b min-h-3 navbar shrink-0">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <div className="flex flex-col items-center">
          <h1 className="font-semibold text-base">{name}</h1>
          {model && (
            <span className="text-xs text-base-content/50">{model}</span>
          )}
        </div>
      </div>
      <div className="navbar-end"></div>
    </div>
  );
}
