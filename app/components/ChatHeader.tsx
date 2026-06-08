interface ChatHeaderProps {
  name: string;
  status?: string;
}

export default function ChatHeader({ name }: ChatHeaderProps) {
  return (
    <div className="bg-base-200 border-base-300 border-b min-h-3 navbar shrink-0">
      <div className="navbar-start"></div>
      <div className="navbar-center">
        <div className="flex flex-col items-center">
          <h1 className="font-semibold text-base">{name}</h1>
        </div>
      </div>
      <div className="navbar-end"></div>
    </div>
  );
}
