import type { TimelineTask } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface TaskListProps {
  tasks: TimelineTask[];
  onEdit(task: TimelineTask): void;
  onDelete(task: TimelineTask): void;
}

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  return (
    <section className="panel">
      <h2 className="text-xl font-semibold">Ближайшие работы</h2>
      {tasks.length === 0 ? (
        <p className="mt-4 text-slate-500">Задач пока нет.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TaskRow({
  task,
  onEdit,
  onDelete,
}: {
  task: TimelineTask;
  onEdit(task: TimelineTask): void;
  onDelete(task: TimelineTask): void;
}) {
  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold">{task.title}</h3>
        <time className="text-sm font-medium text-emerald-800">{task.dueDate}</time>
      </div>
      {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
      {task.plannedBudget !== null && (
        <p className="mt-2 text-sm">
          Бюджет:{" "}
          <strong>
            {task.plannedBudget} {task.currency}
          </strong>
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-8 px-2 py-1"
          onClick={() => onEdit(task)}
        >
          Изменить
        </Button>
        <ConfirmDialog
          title="Удалить задачу?"
          description={`Задача «${task.title}» будет удалена.`}
          onConfirm={() => onDelete(task)}
        />
      </div>
    </li>
  );
}
