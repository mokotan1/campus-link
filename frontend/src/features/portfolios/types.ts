export type PortfolioFormValues = {
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  tools: string[];
  coverImageName: string;
};

export type PortfolioRecord = {
  id: number;
  userId: number;
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  tools: string[];
  createdAt: string;
  coverImageName: string | null;
};
