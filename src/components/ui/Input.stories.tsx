
import type { Meta, StoryObj } from "@storybook/react-vite";
import Input from "./Input";

const meta = {
  title: "TaskFlow/UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    error: {
      control: "text",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "date"],
    },
    required: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    label: "Project Name",
    placeholder: "Enter project name",
    type: "text",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Project Name",
    placeholder: "Enter project name",
  },
};

export const WithValue: Story = {
  args: {
    label: "Project Name",
    defaultValue: "TaskForge Dashboard",
  },
};

export const Email: Story = {
  args: {
    label: "Email Address",
    type: "email",
    placeholder: "example@email.com",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
  },
};

export const Required: Story = {
  args: {
    label: "Project Name",
    placeholder: "Required field",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Project Name",
    defaultValue: "TaskForge",
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    label: "Project Name",
    placeholder: "Enter project name",
    error: "Project name is required",
  },
};

export const NumberInput: Story = {
  args: {
    label: "Estimated Hours",
    type: "number",
    placeholder: "Enter hours",
    min: 0,
  },
};

export const DateInput: Story = {
  args: {
    label: "Due Date",
    type: "date",
  },
};

export const AllStates: Story = {
  args: {
    label: "Project Name",
  },
  render: () => (
    <div className="space-y-5">
      <Input
        label="Default Input"
        placeholder="Enter text"
      />

      <Input
        label="Input With Value"
        defaultValue="TaskForge"
      />

      <Input
        label="Required Input"
        placeholder="Required field"
        required
      />

      <Input
        label="Disabled Input"
        defaultValue="Cannot edit"
        disabled
      />

      <Input
        label="Input With Error"
        placeholder="Enter a project name"
        error="Project name is required"
      />
    </div>
  ),
};
