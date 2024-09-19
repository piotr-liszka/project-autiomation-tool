import {graphql as graphqlInstance} from '@octokit/graphql';
import {Issue, IssueComment, User} from '@octokit/graphql-schema';

import {ProjectV2Item} from '@octokit/graphql-schema/schema';
import {graphql} from "@octokit/graphql/dist-types/types";
import {ContentModel} from "./models/content.js";
import {IssueModel, IssuePriority, IssueStatus, IssueType} from "./models/issue.js";
import {UserModel} from "./models/user.js";
import {IssueMetadata} from "./models/issue-metadata.js";
import {CommentModel} from "./models/comment.js";
import {AppError} from "./utils/error.js";

type Title = Partial<Record<'title', { text?: string }>>;
type Status = Partial<Record<'status', { name?: string, id?: string, updatedAt: string, field: { id: string } }>>;
type ETA = Partial<Record<'eta', { date?: string }>>;
type Metadata = Partial<Record<'metadata', { text?: string }>>;
type IssueItem = ProjectV2Item & Title & Status & ETA & Metadata;
type SearchResponse = {
  search: {
    edges: {
      node: (Issue & { projectItems: { nodes: IssueItem[] } });
    }[];
    issueCount: number;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
};

export class GithubClient {
  private FIELDS_ID = {
    METADATA_FIELD: "PVTF_lADOBKyezc4ABF8IzgfzUWw"
  };

  constructor(private graphqlClient: graphql) {
  }

  static fromToken = (token?: string) => {
    if (!token) {
      throw new Error('Github token is required to create a client');
    }

    return new GithubClient(graphqlInstance.defaults({
      headers: {
        authorization: `Bearer ${token}`,
      },
    }));
  }

  async getAuthorizedUser() {
    const response = await this.graphqlClient<{ viewer: User }>({
      query: `
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
    `,
      orgFirst: 100,
      repoFirst: 100,
      projectFirst: 100,
    });

    if (response.viewer) {
      return new UserModel(
        {
          name: response.viewer.login,
          // email: response.viewer.email,
        },
        response.viewer.login,
      );
    }

    return null;
  }

  async* findIssues(params: {
    organizationName: string;
    projectNumber: number;
    state?: 'open' | 'closed';
    query: string;
  }): AsyncGenerator<{
    status: 'success';
    model: IssueModel;
    total: number;
  } | {
    status: 'error';
    error: Error;
  }> {
    const perPage = 2;
    let cursor = undefined;
    let hasNextPage = true;

    let query = `org:${params.organizationName} type:issue ${params.query}`;

    switch (params.state) {
      case 'closed':
        query = query.concat(` state:closed`);
        break;
      case 'open':
        query = query.concat(` state:open`);
        break;
    }

    const gqlQuery = `query getIssues($parametrizedQuery: String!, $perPage: Int!, $cursor: String) {
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
                    metadata: fieldValueByName(name: "Metadata") {
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
      `;

    while (hasNextPage) {
      let response: SearchResponse;

      try {
        response = await this.graphqlClient({
          query: gqlQuery,
          parametrizedQuery: query,
          perPage,
          cursor,
        });
      } catch (e: Error | unknown) {
        yield {
          status: 'error',
          error: AppError.fromAnyError(e),
        };
        break;
      }

      for (const issueItem of response.search.edges) {
        try {
          const issue = this.#transformIssueFromSearch(issueItem, params.projectNumber);

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
    }
  }

  async saveMetadata(issue: IssueModel) {

    const query = `
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

    await this.graphqlClient<Response>({
      query: query,
      itemId: issue.params.id.v2,
      fieldId: this.FIELDS_ID.METADATA_FIELD,
      projectId: issue.params.project?.id,
      data: issue.metadata.toString(),
    })
  }

  async saveComment(issue: IssueModel, comment: CommentModel) {
    if (comment.id) {
      await this.updateComment(comment)
    } else {
      await this.addComment(issue, comment)
    }
  }

  async updateComment(comment: CommentModel) {
    const query = `
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
    }`

    await this.graphqlClient<Response>({
      query: query,
      commentId: comment.id,
      body: comment.params.content.toDatabase(),
    })
  }

  async addComment(issue: IssueModel, content: CommentModel) {
    const query = `
    mutation update($itemId: ID!, $body: String!) {
      addComment(
        input:{
          subjectId: $itemId,
          body: $body, 
        }
      )
      {
      __typename
      }
    }`

    await this.graphqlClient<Response>({
      query: query,
      itemId: issue.params.id.global,
      body: content.params.content.toDatabase(),
    })
  }

  #transformIssueFromSearch(issueItem: {
    node: Issue & { projectItems: { nodes: IssueItem[] } }
  }, forProjectNumber: number) {
    const projectV2Item = issueItem.node.projectItems.nodes?.find(
      (projectItem: IssueItem) =>
        projectItem?.project.number === forProjectNumber,
    );

    const status: IssueStatus['type'] = 'todo';

    const ghLabels =
      issueItem.node.labels?.nodes?.map((label) => ({
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

    const content = ContentModel.fromHtml(issueItem.node.bodyHTML);
    const assignees = (issueItem.node.assignees.nodes ?? []).map(user => {
      user = <User>user;

      return new UserModel(
        {
          name: user.login
        },
        user.login,
        user.createdAt,
        user.updatedAt
      )
    });

    const comments = (issueItem.node.comments.nodes ?? []).map(comment => {
      comment = <IssueComment>comment;

      const author = new UserModel({
        name: comment.editor?.login ?? ''
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

    const metadata = IssueMetadata.fromString(projectV2Item?.metadata?.text ?? '')
    const eta = projectV2Item?.eta?.date ? new Date(projectV2Item?.eta?.date) : undefined;

    return new IssueModel(
      {
        id: {
          v2: projectV2Item!.id,
          number: issueItem.node.number,
          global: issueItem.node.id,
        },
        title: projectV2Item?.title?.text ?? '',
        content,
        labels: (ghLabels ?? []).map((label) => label.name ?? ''),
        assignees,
        priority,
        project: projectV2Item?.project ? {
          id: projectV2Item.project.id,
          key: projectV2Item.project.number,
        } : undefined,
        status: {
          type: status,
          name: projectV2Item?.status?.name ?? '',
          updatedAt: projectV2Item?.status?.updatedAt ? new Date(projectV2Item?.status?.updatedAt) : null
        },
        type,
        url: issueItem.node.url,
        comments,
        eta
      },
      metadata,
      issueItem.node.createdAt,
      issueItem.node.updatedAt,
    );
  }
}
