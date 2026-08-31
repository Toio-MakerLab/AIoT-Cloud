import { useFactories } from '../context/factories-context';
import { FactoriesActionDialog } from './factories-action-dialog';
import { FactoriesDeleteDialog } from './factories-delete-dialog';

export function FactoriesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useFactories();
  return (
    <>
      <FactoriesActionDialog key="factory-add" open={open === 'add'} onOpenChange={() => setOpen('add')} />

      {currentRow && (
        <>
          <FactoriesActionDialog
            key={`factory-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <FactoriesDeleteDialog
            key={`factory-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
