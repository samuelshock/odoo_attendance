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
            this.videos = useState([]);
            this.polling_notifications = useState(true);
            this.interval_id = null;
        }

        async willStart() {
            if (this.props.session_id === undefined) {
                window.location = '/';
            } else {
                this.startNotifications();
                this.startDisplayingVideos();
            }
        }

        mounted() {
        }

        willUnmount() {
            this.polling_notifications = false;
            clearInterval(this.interval_id);
        }

        startDisplayingVideos() {
            var self = this;
            let count = 0;

            function cycleArray() {
                let vid_length = self.videos.length > 0;

                if (vid_length) {
                    self.videos.splice(0, 1);
                }

                let index = count % self.props.background_video.length;
                console.log(self.props.background_video[index]);
                self.videos.push({
                    id: index,
                    src: self.props.background_video[index].src,
                    type: self.props.background_video[index].type
                });
                count++;
            }

            this.interval_id = setInterval(cycleArray, self.props.interval * 1000);
        }

        startNotifications() {
            var self = this;
            setTimeout(function run() {
                if (self.polling_notifications && self.polling_notifications != undefined) {
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
                    self.state.notifs.push(notif);
                    setTimeout(() => {
                        var index = self.state.notifs.indexOf(notif);
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
            this.time_background_interval = action.context.time_background_interval;
            this.background_video = action.context.video;
            this._super.apply(this, arguments);
        },
        start() {
            const component = new ComponentWrapper(this, mainStandBy, {
                session_id: this.session_id,
                message: this.message,
                time_out: this.time_out,
                interval: this.time_background_interval,
                background_video: this.background_video,
            });
            return component.mount(this.el.querySelector(".o_content"));
        },
    });

    core.action_registry.add("standby_action", ClientAction);

    return ClientAction;
});
