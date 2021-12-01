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

    class NotificationScreen extends Component {}

    class mainStandBy extends Component {

        constructor() {
            super(...arguments);
            this.state = useState({
                text: "",
                notifs: [],
            });
            this.polling_notifications = useState(true);
//            (async function() {
//                var res = await this.startNotifications();
//            })();
        }

        async willStart() {
            if (this.props.session_id === undefined) {
                window.location = '/';
            }
            this.startNotifications();
        }

        mounted() {
        }
        willUnmount() {
            this.polling_notifications = false;
        }

        startNotifications() {
            var self = this;
            console.log(self.props.time_out);
            setTimeout(function run() {
                console.log('pool');
                console.log(self.polling_notifications);
                if (self.polling_notifications && self.polling_notifications != undefined) {
                    console.log('polling notifications');
                    self.showMessage();
                    setTimeout(run, self.props.time_out * 1000);
                }
            }, self.props.time_out * 1000);
        }

        async showMessage() {
            var self = this;
            try {
                const notifications = await this.env.services.rpc({
                    model: "session.attendance",
                    method: "get_notifications",
                    args: [self.props.session_id]
                });
                notifications.map((notif) => {
                    self.state.notifs.push(notif.message);
                    setTimeout(() => {
                        var index = self.state.notifs.indexOf(notif.message);
                        self.state.notifs.splice(index, 1);
                        self.env.services.rpc({
                            model: "report.attendance.trace.log",
                            method: "write",
                            args: [[notif.id], {
                                'welcome_message': true
                            }],
                        });
                    }, 3000);
                });
            } catch (error) {
                console.log(error);
                self.polling_notifications = false;
            }
        }
    }

    mainStandBy.components = { NotificationScreen, AsyncRoot };

    const ClientAction = AbstractAction.extend(WidgetAdapterMixin, {
        init: function (parent, action) {
            this.session_id = action.context.id;
            this.message = action.context.message;
            this.time_out = action.context.time_out_to_display;
            this.background_video = action.context.video;
            this._super.apply(this, arguments);
        },
        start() {
            const component = new ComponentWrapper(this, mainStandBy, {
                session_id: this.session_id,
                message: this.message,
                time_out: this.time_out,
                background_video: this.background_video,
            });
            return component.mount(this.el.querySelector(".o_content"));
        },
    });

    core.action_registry.add("standby_action", ClientAction);

    return ClientAction;
});
