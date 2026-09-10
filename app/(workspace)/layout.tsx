import { WorkspaceStepper } from "./components/workspace-stepper";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <WorkspaceStepper />
      <div className="flex-1">{children}</div>
    </div>
  );
}

