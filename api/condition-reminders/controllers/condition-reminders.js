'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
    }

    const data = await strapi.services['condition-reminders'].find({ profile: user.profile });
    if (!data) {
      return ctx.notFound();
    }

    const { conditionId } = ctx.request.query;
    if (conditionId === undefined) {
      // Return all collection
      return ctx.send(data);

    } else {
      // Return package specific conditions

      const conditionIdInt = parseInt(conditionId);
      if (isNaN(conditionIdInt)) {
        return ctx.badRequest(null, [{messages: [{id: 'Condition id not good format.'}]}]);
      }

      // First index
      const condition = (await strapi.services.conditions.find({ id: conditionIdInt }))[0];
      if (!condition) {
        return ctx.notFound(null, [{ messages: [{ id: 'Condition does not exist.' }] }]);
      }

      if (condition.profile.id !== user.profile) {
        return ctx.badRequest(null, [{messages: [{id: 'This condition does not belong to the user specified.'}]}]);
      }

      const newData = data.filter((element) => element.condition.id === conditionIdInt);
      return ctx.send(newData);
    }
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found.' }] }]);
    }

    const { body } = ctx.request;
    const { conditionId, datetime } = body;

    const condition = (await strapi.services.conditions.find({ id: conditionId }))[0];
    if (!condition) {
      return ctx.notFound();
    }

    // Create reminder
    return await strapi.services['condition-reminders'].create({
      condition,
      datetime: datetime.toString(),
      profile: user.profile,
    });
  },
};
