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

    const data = await strapi.services.preconditions.find({ profile: user.profile });
    if (!data) {
      return ctx.notFound();
    }

    const { plannedPackageId } = ctx.request.query;
    if (plannedPackageId === undefined) {
      return ctx.badRequest(null, [{messages: [{id: 'Planned package id was not set in request parameters.'}]}]);
    }
    const plannedPackageIdInt = parseInt(plannedPackageId);
    if (isNaN(plannedPackageIdInt)) {
      return ctx.badRequest(null, [{messages: [{id: 'Planned package id not good format.'}]}]);
    }

    // First index
    const plannedPackage = (await strapi.services['planned-package'].find({ id: plannedPackageIdInt }))[0];
    if (!plannedPackage) {
      return ctx.notFound(null, [{ messages: [{ id: 'Planned package not exist.' }] }]);
    }

    if (plannedPackage.profile.id !== user.profile) {
      return ctx.badRequest(null, [{messages: [{id: 'This planned package does not belong to the user specified.'}]}]);
    }

    const newData = data.filter((element) => element.planned_package.id === plannedPackageIdInt);
    return ctx.send(newData);
  }
};
