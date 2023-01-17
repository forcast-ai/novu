import { UserSession } from '@novu/testing';
import { expect } from 'chai';

import { createLayout } from './helpers';

import { LayoutDto } from '../dtos';
import { TemplateVariableTypeEnum } from '../types';

const BASE_PATH = '/v1/layouts';

describe('Get a layout - /layouts/:layoutId (GET)', async () => {
  const layoutName = 'layout-name-creation';
  const isDefault = true;
  let session: UserSession;
  let createdLayout: LayoutDto;

  before(async () => {
    session = new UserSession();
    await session.initialize();
    createdLayout = await createLayout(session, layoutName, isDefault);
  });

  it('should retrieve the requested layout successfully if exists in the database for that user', async () => {
    const expectedDescription = 'Amazing new layout';
    const expectedContent = [
      {
        type: 'text',
        content: 'This are the text contents of the template for {{firstName}}',
        styles: { textAlign: 'left' },
      },
      {
        type: 'button',
        content: 'SIGN UP',
        url: 'https://url-of-app.com/{{urlVariable}}',
      },
    ];

    const expectedVariables = [
      { name: 'firstName', type: TemplateVariableTypeEnum.STRING, defaultValue: 'John', required: false },
    ];

    const url = `${BASE_PATH}/${createdLayout._id}`;
    const getResponse = await session.testAgent.get(url);

    expect(getResponse.statusCode).to.eql(200);

    const layout = getResponse.body.data;

    expect(layout._id).to.eql(createdLayout._id);
    expect(layout._environmentId).to.eql(session.environment._id);
    expect(layout._organizationId).to.eql(session.organization._id);
    expect(layout._creatorId).to.eql(session.user._id);
    expect(layout.name).to.eql(layoutName);
    expect(layout.description).to.eql(expectedDescription);
    expect(layout.content).to.eql(expectedContent);
    expect(layout.variables).to.eql(expectedVariables);
    expect(layout.contentType).to.eql('customHtml');
    expect(layout.isDefault).to.eql(true);
    expect(layout.isDeleted).to.eql(false);
    expect(layout.createdAt).to.be.ok;
    expect(layout.updatedAt).to.be.ok;
  });

  it('should throw a not found error when the layout ID does not exist in the database for the user requesting it', async () => {
    const nonExistingLayoutId = 'ab12345678901234567890ab';
    const url = `${BASE_PATH}/${nonExistingLayoutId}`;
    const { body } = await session.testAgent.get(url);

    expect(body.statusCode).to.equal(404);
    expect(body.message).to.eql(
      `Layout not found for id ${nonExistingLayoutId} in the environment ${session.environment._id}`
    );
    expect(body.error).to.eql('Not Found');
  });
});
