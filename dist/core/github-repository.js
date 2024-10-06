var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _GithubClient_instances, _GithubClient_graphqlClient, _GithubClient_executeGraphQLQuery, _GithubClient_transformSingleItem;
import { graphql as graphqlInstance } from '@octokit/graphql';
import { ContentModel } from "./models/content.js";
import { IssueModel } from "./models/issue.js";
import { UserModel } from "./models/user.js";
import { CommentModel } from "./models/comment.js";
import { AppError } from "./utils/error.js";
import { ProjectModel } from "./models/project.js";
import { PullRequestModel } from "./models/pull-request.js";
import { Inject, Service } from "typedi";
import { Config } from "./config/config.js";
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
}`;
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
`;
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
  `;
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
}`;
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
`;
const GET_PULL_REQUEST = `
query getIssue($owner: String!, $repo: String!, $pullRequestId: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pullRequestId) {
        id
        title
      }
    }
}`;
let GithubClient = class GithubClient {
    constructor(config) {
        _GithubClient_instances.add(this);
        this.config = config;
        _GithubClient_graphqlClient.set(this, void 0);
    }
    authorize(token) {
        __classPrivateFieldSet(this, _GithubClient_graphqlClient, graphqlInstance.defaults({
            headers: {
                authorization: `Bearer ${token}`,
            },
        }), "f");
    }
    async getAuthorizedUser() {
        const response = await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, GET_AUTHORIZED_USER, {
            orgFirst: 100,
            repoFirst: 100,
            projectFirst: 100,
        });
        if (response.viewer) {
            return new UserModel({
                uniqName: response.viewer.login,
            }, response.viewer.id);
        }
        return null;
    }
    async getProjectV2Info(organizationName, projectNumber) {
        const response = await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, GET_PROJECT, {
            orgName: organizationName,
            projectNumber: projectNumber,
        });
        const projectV2 = response.organization?.projectV2;
        const fields = [];
        for (const field of projectV2?.fields?.nodes ?? []) {
            if (!field) {
                continue;
            }
            fields.push({
                id: field.id,
                name: field.name.toLowerCase()
            });
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
        }, projectV2?.id);
    }
    ;
    async getProjectItem(project, repo, issueNumber) {
        const response = await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, GET_PROJECT_ITEM, {
            owner: project.params.organization.uniqName,
            repo: repo,
            issueNumber: issueNumber
        });
        return __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_transformSingleItem).call(this, response.repository.issue, project);
    }
    async getPullRequest(project, repo, pullRequestId) {
        const response = await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, GET_PULL_REQUEST, {
            owner: project.params.organization.uniqName,
            repo: repo,
            pullRequestId,
        });
        const prResponse = response.repository?.pullRequest;
        return new PullRequestModel({
            title: prResponse?.title ?? '',
        }, prResponse?.id);
    }
    async *findIssues(project, params) {
        const perPage = 10;
        let cursor = undefined;
        let hasNextPage = true;
        let query = `org:${project.params.organization.uniqName} type:issue ${params.query}`;
        while (hasNextPage) {
            try {
                const response = await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, LIST_ISSUES, {
                    parametrizedQuery: query,
                    perPage,
                    cursor,
                });
                for (const issueItem of response.search.edges) {
                    try {
                        const issue = __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_transformSingleItem).call(this, issueItem.node, project);
                        yield {
                            status: 'success',
                            model: issue,
                            total: response.search.issueCount,
                        };
                    }
                    catch (e) {
                        yield {
                            status: 'error',
                            error: AppError.fromAnyError(e),
                        };
                    }
                }
                cursor = response.search.pageInfo.endCursor;
                hasNextPage = response.search.pageInfo.hasNextPage;
            }
            catch (e) {
                yield {
                    status: 'error',
                    error: AppError.fromAnyError(e),
                };
                break;
            }
        }
    }
    async updateField(issue, fieldId, value) {
        const params = {
            itemId: issue.params.id.v2,
            fieldId: fieldId,
            projectId: issue.params.project?.id,
            data: value
        };
        switch (true) {
            case value instanceof Date:
                await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, UPDATE_DATE_FIELD_V2, params);
                break;
            default:
                await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, UPDATE_TEXT_FIELD_V2, params);
                break;
        }
    }
    async saveComment(issue, comment) {
        if (comment.id) {
            await this.updateComment(comment);
        }
        else {
            await this.addComment(issue, comment);
        }
    }
    async updateComment(comment) {
        await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, UPDATE_COMMENT_QUERY, {
            commentId: comment.id,
            body: comment.params.content.toDatabase(),
        });
    }
    async addComment(issue, content) {
        await __classPrivateFieldGet(this, _GithubClient_instances, "m", _GithubClient_executeGraphQLQuery).call(this, ADD_COMMENT_QUERY, {
            itemId: issue.id,
            body: content.params.content.toDatabase(),
        });
    }
};
_GithubClient_graphqlClient = new WeakMap();
_GithubClient_instances = new WeakSet();
_GithubClient_executeGraphQLQuery = async function _GithubClient_executeGraphQLQuery(query, variables) {
    if (!__classPrivateFieldGet(this, _GithubClient_graphqlClient, "f")) {
        throw new Error('Client is not authorized');
    }
    return await __classPrivateFieldGet(this, _GithubClient_graphqlClient, "f").call(this, { query, ...variables });
};
_GithubClient_transformSingleItem = function _GithubClient_transformSingleItem(issueItem, forProject) {
    const projectV2Item = issueItem.projectItems.nodes?.find((projectItem) => projectItem?.project.number === forProject.params.number);
    const status = 'todo';
    const ghLabels = issueItem.labels?.nodes?.map((label) => ({
        name: label?.name,
        color: label?.color,
    })) ?? [];
    let priority = 'low';
    let type = 'story';
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
        user = user;
        return new UserModel({
            uniqName: user.login
        }, user.login, user.createdAt, user.updatedAt);
    });
    const author = new UserModel({
        uniqName: issueItem.author?.login ?? ''
    }, issueItem.author?.login);
    const comments = (issueItem.comments.nodes ?? []).map(comment => {
        comment = comment;
        const author = new UserModel({
            uniqName: comment.editor?.login ?? ''
        }, comment.editor?.login);
        const content = ContentModel.fromHtml(comment.body);
        return new CommentModel({
            content,
            author,
        }, comment.id, comment.createdAt, comment.updatedAt);
    });
    let eta = projectV2Item?.eta?.date ? new Date(projectV2Item?.eta?.date) : undefined;
    const startDate = projectV2Item?.start?.date ? new Date(projectV2Item?.start?.date) : undefined;
    if (eta && this.config.get('eta.transformToEndOfTheDay')) {
        eta.setHours(23, 59, 59, 999);
    }
    return new IssueModel({
        id: {
            v2: projectV2Item.id,
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
    }, issueItem.id, issueItem.createdAt, issueItem.updatedAt);
};
GithubClient = __decorate([
    Service(),
    __param(0, Inject()),
    __metadata("design:paramtypes", [Config])
], GithubClient);
export { GithubClient };
