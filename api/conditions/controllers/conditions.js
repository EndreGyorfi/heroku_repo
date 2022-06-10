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

        const data = await strapi.services.conditions.find({ profile: user.profile });
        if (!data) {
          return ctx.notFound();
        }

        const { activePackageId } = ctx.request.query;
        if (activePackageId === undefined) {
         // Return all collection
          return ctx.send(data);

        } else {
          // Return package specific conditions

          const activePackageIdInt = parseInt(activePackageId);
          if (isNaN(activePackageIdInt)) {
            return ctx.badRequest(null, [{messages: [{id: 'Active package id not good format.'}]}]);
          }

          // First index
          const activePackage = (await strapi.services['active-package'].find({ id: activePackageIdInt }))[0];
          if (!activePackage) {
            return ctx.notFound(null, [{ messages: [{ id: 'Active package not exist.' }] }]);
          }

          if (activePackage.profile.id !== user.profile) {
            return ctx.badRequest(null, [{messages: [{id: 'This active package does not belong to the user specified.'}]}]);
          }

          const newData = data.filter((element) => element.active_package.id === activePackageIdInt);
          return ctx.send(newData);
        }
    }
};
