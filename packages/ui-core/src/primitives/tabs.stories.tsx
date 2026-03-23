import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">General information about the employee.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Detailed employment information.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Employment history and changes.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="on-leave">On Leave</TabsTrigger>
        <TabsTrigger value="terminated" disabled>
          Terminated
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="text-sm p-4">Active employees list.</p>
      </TabsContent>
      <TabsContent value="on-leave">
        <p className="text-sm p-4">Employees currently on leave.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="personal" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
        <TabsTrigger value="compensation">Compensation</TabsTrigger>
        <TabsTrigger value="benefits">Benefits</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <p className="text-sm p-4 text-muted-foreground">Personal information tab content.</p>
      </TabsContent>
      <TabsContent value="employment">
        <p className="text-sm p-4 text-muted-foreground">Employment details tab content.</p>
      </TabsContent>
      <TabsContent value="compensation">
        <p className="text-sm p-4 text-muted-foreground">Compensation details tab content.</p>
      </TabsContent>
      <TabsContent value="benefits">
        <p className="text-sm p-4 text-muted-foreground">Benefits enrollment tab content.</p>
      </TabsContent>
      <TabsContent value="documents">
        <p className="text-sm p-4 text-muted-foreground">Uploaded documents tab content.</p>
      </TabsContent>
    </Tabs>
  ),
};
