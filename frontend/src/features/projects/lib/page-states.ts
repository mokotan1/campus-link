export type PageRenderState =
  | "ready"
  | "empty"
  | "not-found"
  | "unauthorized"
  | "forbidden"
  | "error";

export type PageStateInput = {
  authenticated: boolean;
  forbidden?: boolean;
  error?: boolean;
  hasData?: boolean;
  notFound?: boolean;
};

export function resolvePageRenderState(input: PageStateInput): PageRenderState {
  if (input.error) {
    return "error";
  }

  if (input.forbidden) {
    return "forbidden";
  }

  if (input.notFound) {
    return "not-found";
  }

  if (!input.authenticated) {
    return "unauthorized";
  }

  if (!input.hasData) {
    return "empty";
  }

  return "ready";
}

export function resolveProjectsListState(projectCount: number): PageRenderState {
  return projectCount > 0 ? "ready" : "empty";
}

export function resolveProjectDetailState(projectFound: boolean): PageRenderState {
  return projectFound ? "ready" : "not-found";
}

export function resolveApplicationsPageState(
  authenticated: boolean,
  applicationCount: number,
): PageRenderState {
  if (!authenticated) {
    return "unauthorized";
  }

  return applicationCount > 0 ? "ready" : "empty";
}
