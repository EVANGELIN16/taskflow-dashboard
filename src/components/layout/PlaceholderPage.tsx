import Card from "../ui/Card";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>

      <Card>
        <p className="text-text-secondary">{description}</p>
      </Card>
    </div>
  );
}

export default PlaceholderPage;
