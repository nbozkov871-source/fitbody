import { ClientForm } from "../client-form";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <ClientForm
      title="Нов клиент"
      description="Попълнете основните данни — можете да ги допълните по-късно."
      action={createClientRecord}
      submitLabel="Запази клиента"
      cancelHref="/clients"
    />
  );
}
