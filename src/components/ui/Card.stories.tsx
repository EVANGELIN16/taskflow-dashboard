
import type { Meta, StoryObj } from "@storybook/react-vite";
import Card from "./Card";

const meta = {
  title: "TaskFlow/UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    title: "Project Overview",
    children: "This card displays project information.",
  },
  argTypes: {
    title: {
      control: "text",
    },
    children: {
      control: "text",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default card
export const Default: Story = {
  args: {
    title: "Project Overview",
    children: "Manage your TaskFlow projects here.",
  },
};

// Card without a title
export const WithoutTitle: Story = {
  args: {
    title: undefined,
    children: "This card does not have a title.",
  },
};

// Project details card
export const ProjectCard: Story = {
  args: {
    title: "TaskForge Dashboard",
  },
  render: (args) => (
    <Card {...args}>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          A full-stack project management application.
        </p>

        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          In Progress
        </span>

        <p className="text-sm text-gray-500">
          React, TypeScript, Express and PostgreSQL
        </p>
      </div>
    </Card>
  ),
};

// Statistics card
export const StatisticsCard: Story = {
  args: {
    title: "Total Projects",
  },
  render: (args) => (
    <Card {...args}>
      <p className="text-3xl font-bold text-blue-600">
        12
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Active and completed projects
      </p>
    </Card>
  ),
};

// Card with custom styling
export const CustomStyle: Story = {
  args: {
    title: "Important Notice",
    children: "This card uses a custom border color.",
    className: "border-blue-500",
  },
};
