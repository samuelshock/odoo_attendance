odoo.define("odoo_attendance.standby", function (require) {
    "use strict";

    const AbstractAction = require("web.AbstractAction");

    const {
        ComponentWrapper,
        WidgetAdapterMixin,
    } = require("web.OwlCompatibility");

    const core = require("web.core");

    const { Component } = owl;
    const { useRef, useState } = owl.hooks;
    const { AsyncRoot } = owl.misc;


    class mainStandBy extends Component {
    }

    const ClientAction = AbstractAction.extend(WidgetAdapterMixin, {
        init: function (parent, action) {
            this.session_id = action.context.id;
            this.background_video = action.context.background_video;
            this._super.apply(this, arguments);
        },
        start() {
            const component = new ComponentWrapper(this, mainStandBy, {
                session_id: this.session_id,
                background_video: this.background_video,
            });
            return component.mount(this.el.querySelector(".o_content"));
        },
    });

    core.action_registry.add("standby_action", ClientAction);

    return ClientAction;
});
