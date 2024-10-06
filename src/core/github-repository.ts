import {graphql as graphqlInstance} from '@octokit/graphql';
import {Issue, IssueComment, Organization, PullRequest, User} from '@octokit/graphql-schema';

import {ProjectV2Item} from '@octokit/graphql-schema/schema';
import {graphql} from "@octokit/graphql/dist-types/types";
import {ContentModel} from "./models/content.js";
import {IssueModel, IssuePriority, IssueStatus, IssueType} from "./models/issue.js";
import {UserModel} from "./models/user.js";
import {CommentModel} from "./models/comment.js";
import {AppError} from "./utils/error.js";
import {ProjectModel} from "./models/project.js";
import {PullRequestModel} from "./models/pull-request.js";
import {Inject, Service} from "typedi";
import {Config} from "./config/config.js";

type Title = Partial<Record<'title', { text?: string }>>;
type Status = Partial<Record<'status', { name?: string, id?: string, updatedAt: string, field: { id: string } }>>;
type ETA = Partial<Record<'eta', { date?: string }>>;
type StartDate = Partial<Record<'start', { date?: string }>>;
type Metadata = Partial<Record<'metadata', { text?: string }>>;
type IssueItem = ProjectV2Item & Title & Status & ETA & Metadata & StartDate;

type SingleItem = (Issue & { projectItems: { nodes: IssueItem[] } });

type SingleItemResponse = {
  repository: {
    issue: SingleItem
  }
}
type SinglePrResponse = {
  repository: {
    pullRequest: PullRequest
  }
}

type SearchResponse = {
  search: {
    edges: {
      node: SingleItem;
    }[];
    issueCount: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
};


const UPDATE_COMMENT_QUERY = `
mutation update($commentId: ID!, $body: String!) {
  updateIssueComment(
    input:{
      id: $commentId,
      body: $body, 
    }
  )
  {
  __typename
  }
}`;

const ADD_COMMENT_QUERY = `
mutation add($itemId: ID!, $body: String!) {
  addComment(
    input:{
      subjectId: $itemId,
      body: $body, 
    }
  )
  {
  __typename
  }
}`;

const UPDATE_DATE_FIELD_V2 = `
mutation updateField($itemId: ID!, $fieldId: ID!, $projectId: ID!, $data: Date!) {
  updateProjectV2ItemFieldValue(
    input:{
      itemId: $itemId,
      fieldId: $fieldId, 
      projectId: $projectId,
      value: {
        date: $data
      }
    }
  )
  {
  projectV2Item {
      id
    }
  }
}`;

const UPDATE_TEXT_FIELD_V2 = `
mutation updateMetadata($itemId: ID!, $fieldId: ID!, $projectId: ID!, $data: String!) {
  updateProjectV2ItemFieldValue(
    input:{
      itemId: $itemId,
      fieldId: $fieldId, 
      projectId: $projectId,
      value: {
        text: $data
      }
    }
  )
  {
  projectV2Item {
      id
    }
  }
}`

const LIST_ISSUES = `
query findIssues($parametrizedQuery: String!, $perPage: Int!, $cursor: String) {
  search(first: $perPage, after: $cursor, type: ISSUE, query: $parametrizedQuery) {
    issueCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        __typename
        ... on Issue {
          id
          number
          title
          bodyUrl
          bodyText
          body
          bodyHTML
          createdAt,
          title,
          url,
          author {
              login
          },
          comments(first: 100){
            nodes {
              id
              editor {
                login
              }
              body
              bodyHTML
              createdAt
              updatedAt
            }
          }
          labels(first: 100) {
            nodes {
              name
              color
            }
          }
          repository {
            id
            name
            owner {
              login
            }
          }
          assignees(first: 30) {
            nodes {
              login
              createdAt
              updatedAt
            }
          }
          projectItems(first: 40) {
            nodes {
              project {
                id
                number
                title
              }
              id,
              title: fieldValueByName(name: "Title") {
                ... on ProjectV2ItemFieldTextValue {
                  id
                  text
                   field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
              }
              status: fieldValueByName(name: "Status") {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  id
                  name
                  updatedAt
                   field {
                    ... on ProjectV2SingleSelectField {
                      id
                      name
                    }
                  }
                }
              }
              eta: fieldValueByName(name: "ETA") {
                ... on ProjectV2ItemFieldDateValue {
                  id
                  date
                   field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
              }
              start: fieldValueByName(name: "Start Date") {
                ... on ProjectV2ItemFieldDateValue {
                  id
                  date
                   field {
                    ... on ProjectV2Field {
                      id
                      name
                    }
                  }
                }
              }
              updatedAt
              createdAt
            }
          }
        }
      }
    }
  }
}
`

const GET_AUTHORIZED_USER = `
query getAuthDetails($orgFirst: Int!, $orgAfter: String, $repoFirst: Int!, $repoAfter: String, $projectFirst: Int!, $projectAfter: String) {
      viewer {
        login
        id
        email
        organizations(first: $orgFirst, after: $orgAfter) {
          nodes {
            login
            id
            name
            repositories(first: $repoFirst, after: $repoAfter) {
              nodes {
                id
                name
              }
            }
            projectsV2(first: $projectFirst, after: $projectAfter) {
              nodes {
                id
                title
              }
            }
          }
        }
      }
    }
  `

const GET_PROJECT = `
query getInfo($orgName: String!, $projectNumber: Int!) {
  organization(login: $orgName) {
    id
    name
    login
    projectV2(number: $projectNumber) {
      id
      number
      title
      fields(last: 100) {
        nodes {
          ... on ProjectV2Field {
            id
            name
          }
          ... on ProjectV2IterationField {
            id
            name
          }
          ... on ProjectV2SingleSelectField {
            id
            name
          }
        }
      }
    }
  }
}`

const GET_PROJECT_ITEM = `
query getIssue($owner: String!, $repo: String!, $issueNumber: Int!) {
    repository(owner:$owner, name:$repo) {
        issue(number: $issueNumber) {
            __typename
            ... on Issue {
                id
                number
                title
                url
                bodyText
                body
                bodyHTML
                createdAt,
                title,
                url,
                author {
                    login
                }
                comments(first: 100){
                    nodes {
                        editor {
                            login
                        }
                        body
                        bodyHTML
                    }
                }
                labels(first: 100) {
                    nodes {
                        name
                        color
                    }
                }
                repository {
                    id
                    name
                    owner {
                        login
                    }
                }
                assignees(first: 30) {
                    nodes {
                        id
                        email
                        name
                        createdAt
                        updatedAt
                    }
                }
                projectItems(first: 40) {
                    nodes {
                        project {
                            id
                            number
                            title
                        }
                        id,
                        JIRA_ID: fieldValueByName(name: "JIRA_ID") {
                            ... on ProjectV2ItemFieldTextValue {
                                id
                                text
                                field {
                                    ... on ProjectV2Field {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        title: fieldValueByName(name: "Title") {
                            ... on ProjectV2ItemFieldTextValue {
                                id
                                text
                                field {
                                    ... on ProjectV2Field {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        status: fieldValueByName(name: "Status") {
                            ... on ProjectV2ItemFieldSingleSelectValue {
                                id
                                name
                                updatedAt
                                field {
                                    ... on ProjectV2SingleSelectField {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        eta: fieldValueByName(name: "ETA") {
                            ... on ProjectV2ItemFieldDateValue {
                                id
                                date
                                field {
                                    ... on ProjectV2Field {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        metadata: fieldValueByName(name: "Metadata") {
                            ... on ProjectV2ItemFieldTextValue {
                                id

                                field {
                                    ... on ProjectV2Field {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        start: fieldValueByName(name: "Start Date") {
                            ... on ProjectV2ItemFieldDateValue {
                                id
                                date
                                field {
                                    ... on ProjectV2Field {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                        updatedAt
                        createdAt
                    }
                }
            }
        }
    }
}
`

const GET_PULL_REQUEST = `
query getIssue($owner: String!, $repo: String!, $pullRequestId: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pullRequestId) {
        id
        title
      }
    }
}`

@Service()
export class GithubClient {
  #graphqlClient?: graphql;

  constructor(
    @Inject() private config: Config
  ) {
  }


  authorize(token: string) {
    this.#graphqlClient = graphqlInstance.defaults({
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
  }

  async getAuthorizedUser() {
    const response: { viewer: User } = await this.#executeGraphQLQuery<{ viewer: User }>(GET_AUTHORIZED_USER, {
      orgFirst: 100,
      repoFirst: 100,
      projectFirst: 100,
    });

    if (response.viewer) {
      return new UserModel(
        {
          uniqName: response.viewer.login,
        },
        response.viewer.id,
      );
    }

    return null;
  }

  async getProjectV2Info(organizationName: string, projectNumber: number) {
    const response: { organization: Organization } = await this.#executeGraphQLQuery<{
      organization: Organization
    }>(GET_PROJECT, {
      orgName: organizationName,
      projectNumber: projectNumber,
    });

    const projectV2 = response.organization?.projectV2;
    const fields: { id: string, name: string }[] = []

    for (const field of projectV2?.fields?.nodes ?? []) {
      if (!field) {
        continue;
      }

      fields.push({
        id: field.id,
        name: field.name.toLowerCase()
      })
    }

    return new ProjectModel({
        title: projectV2?.title ?? '',
        number: projectV2?.number,
        fields,
        organization: {
          name: response.organization.name ?? '',
          uniqName: response.organization.login ?? '',
          id: response.organization.id,
        }
      },
      projectV2?.id
    )
  };

  async getProjectItem(project: ProjectModel, repo: string, issueNumber: number) {
    const response: SingleItemResponse = await this.#executeGraphQLQuery<SingleItemResponse>(GET_PROJECT_ITEM, {
      owner: project.params.organization.uniqName,
      repo: repo,
      issueNumber: issueNumber
    });

    return this.#transformSingleItem(response.repository.issue, project);
  }

  async getPullRequest(project: ProjectModel, repo: string, pullRequestId: number) {
    const response: SinglePrResponse = await this.#executeGraphQLQuery<SinglePrResponse>(GET_PULL_REQUEST, {
      owner: project.params.organization.uniqName,
      repo: repo,
      pullRequestId,
    });

    const prResponse = response.repository?.pullRequest;

    return new PullRequestModel({
        title: prResponse?.title ?? '',
      },
      prResponse?.id
    )
  }

  async* findIssues(project: ProjectModel, params: {
    query: string;
  }): AsyncGenerator<{
    status: 'success';
    model: IssueModel;
    total: number;
  } | {
    status: 'error';
    error: Error;
  }> {
    const perPage = 10;
    let cursor = undefined;
    let hasNextPage = true;
    let query = `org:${project.params.organization.uniqName} type:issue ${params.query}`;

    while (hasNextPage) {
      try {
        const response: SearchResponse = await this.#executeGraphQLQuery<SearchResponse>(LIST_ISSUES, {
          parametrizedQuery: query,
          perPage,
          cursor,
        });

        for (const issueItem of response.search.edges) {
          try {
            const issue = this.#transformSingleItem(issueItem.node, project);

            yield {
              status: 'success',
              model: issue,
              total: response.search.issueCount,
            };
          } catch (e: Error | unknown) {
            yield {
              status: 'error',
              error: AppError.fromAnyError(e),
            };
          }
        }

        cursor = response.search.pageInfo.endCursor;
        hasNextPage = response.search.pageInfo.hasNextPage;

      } catch (e: Error | unknown) {
        yield {
          status: 'error',
          error: AppError.fromAnyError(e),
        };
        break;
      }
    }
  }

  async updateField(issue: IssueModel, fieldId: string, value: string | Date) {
    const params = {
      itemId: issue.params.id.v2,
      fieldId: fieldId,
      projectId: issue.params.project?.id,
      data: value
    }

    switch (true) {
      case value instanceof Date:
        await this.#executeGraphQLQuery(UPDATE_DATE_FIELD_V2, params)
        break;

      default:
        await this.#executeGraphQLQuery(UPDATE_TEXT_FIELD_V2, params)
        break;
    }
  }

  async saveComment(issue: IssueModel, comment: CommentModel) {
    if (comment.id) {
      await this.updateComment(comment)
    } else {
      await this.addComment(issue, comment)
    }
  }

  async updateComment(comment: CommentModel) {
    await this.#executeGraphQLQuery(UPDATE_COMMENT_QUERY, {
      commentId: comment.id,
      body: comment.params.content.toDatabase(),
    });
  }

  async addComment(issue: IssueModel, content: CommentModel) {
    await this.#executeGraphQLQuery(ADD_COMMENT_QUERY, {
      itemId: issue.id,
      body: content.params.content.toDatabase(),
    });
  }

  async #executeGraphQLQuery<T = unknown>(query: string, variables: Record<string, unknown>): Promise<T> {
    if(!this.#graphqlClient) {
      throw new Error('Client is not authorized');
    }
    return await this.#graphqlClient<T>({query, ...variables});
  }

  #transformSingleItem(
    issueItem: SingleItem,
    forProject: ProjectModel
  ) {
    const projectV2Item = issueItem.projectItems.nodes?.find(
      (projectItem: IssueItem) =>
        projectItem?.project.number === forProject.params.number,
    );

    const status: IssueStatus['type'] = 'todo';

    const ghLabels =
      issueItem.labels?.nodes?.map((label) => ({
        name: label?.name,
        color: label?.color,
      })) ?? [];

    let priority: IssuePriority = 'low';
    let type: IssueType = 'story';

    for (const ghLabel of ghLabels) {
      switch (ghLabel.name) {
        case 'low':
          priority = 'low';
          break;
        case 'medium':
          priority = 'medium';
          break;
        case 'high':
          priority = 'high';
          break;
        case 'bug':
          type = 'bug';
          break;
      }
    }

    const content = ContentModel.fromHtml(issueItem.bodyHTML);
    const assignees = (issueItem.assignees.nodes ?? []).map(user => {
      user = <User>user;

      return new UserModel(
        {
          uniqName: user.login
        },
        user.login,
        user.createdAt,
        user.updatedAt
      )
    });

    const author = new UserModel({
      uniqName: issueItem.author?.login ?? ''
    }, issueItem.author?.login);

    const comments = (issueItem.comments.nodes ?? []).map(comment => {
      comment = <IssueComment>comment;

      const author = new UserModel({
        uniqName: comment.editor?.login ?? ''
      }, comment.editor?.login);

      const content = ContentModel.fromHtml(comment.body);

      return new CommentModel(
        {
          content,
          author,
        },
        comment.id,
        comment.createdAt,
        comment.updatedAt
      )
    });

    let eta = projectV2Item?.eta?.date ? new Date(projectV2Item?.eta?.date) : undefined;
    const startDate = projectV2Item?.start?.date ? new Date(projectV2Item?.start?.date) : undefined;


    if (eta && this.config.get('eta.transformToEndOfTheDay')) {
      eta.setHours(23, 59, 59, 999);
    }

    return new IssueModel(
      {
        id: {
          v2: projectV2Item!.id,
          number: issueItem.number
        },
        author,
        title: projectV2Item?.title?.text ?? '',
        content,
        labels: (ghLabels ?? []).map((label) => label.name ?? ''),
        assignees,
        priority,
        project: forProject,
        status: {
          type: status,
          name: projectV2Item?.status?.name ?? '',
          updatedAt: projectV2Item?.status?.updatedAt ? new Date(projectV2Item?.status?.updatedAt) : null
        },
        type,
        url: issueItem.url,
        comments,
        eta,
        startDate
      },
      issueItem.id,
      issueItem.createdAt,
      issueItem.updatedAt,
    );
  }
}
