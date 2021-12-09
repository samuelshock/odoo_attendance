odoo.define("odoo_attendance", function (require) {
    "use strict";

    const AbstractAction = require("web.AbstractAction");
    const env = require('web.env');

    const {
        ComponentWrapper,
        WidgetAdapterMixin,
    } = require("web.OwlCompatibility");

    const core = require("web.core");

    const { Component } = owl;
    const { useRef, useState } = owl.hooks;
    const { AsyncRoot } = owl.misc;


    class User extends Component {
        checkIn() {
            this.trigger("check-in", { id: this.props.user.id})
        }
    }

    User.props = ["user"];

    class NotificationList extends Component {}

    class FormView extends Component {

        users = useState([]);
        inputRef = useRef("add-input");

        constructor() {
            super(...arguments);
            this.state = useState({
                text: "",
                notifs: [],
                background: `background-image:url(${this.props.background_image}); width:100%; height:100%;`
            });
        }

        async willStart() {
            if (this.props.session_id === undefined) {
                window.location = '/';
            }
            core.bus.on('barcode_scanned', this, function (qr) {
                this.qrSearchUser(qr);
            });
        }

        mounted() {
            this.inputRef.el.focus();
        }

        async qrSearchUser(qr) {
            const user = await this.env.services.rpc({
                model: "session.attendance",
                method: "search_user_qr",
                args: [this.props.session_id, qr]
            });
            if (user) {
                if (user.user_logged) {
                    this.state.text = "El usuario: "+ user.name + "ya hizo check-in hoy!";
                } else {
                    this.state.text = "Bienvenido "+ user.name;
                    const newLog = await this.env.services.rpc({
                       model: "report.attendance.trace.log",
                       method: "create",
                       args: [
                         {
                           partner_id: user.id,
                           psa_id: this.props.session_id,
                         },
                       ],
                    });
                }
                this.showMessage();
                while (this.users.length > 0) {
                    this.users.pop();
                }
            } else {
                this.state.text = "Usuario no encontrado, o intente con otro QR";
                this.showMessage();
            }
        }

        async searchUser(ev) {
            if (ev.keyCode === 13) {
                const search_text = ev.target.value.trim();
                ev.target.value = "";
                if (search_text) {
                    const users = await this.env.services.rpc({
                        model: "session.attendance",
                        method: "search_user",
                        args: [this.props.session_id, search_text]
                    });
                    if (users.length > 0) {
                        users.map((user) =>
                            this.users.push({
                                id: user.id,
                                userName: user.name,
                                image: user.image,
                                vat: user.vat,
                                x_user_code: user.x_user_code,
                                x_user_type: user.x_user_type
                            })
                        );
                    } else {
                        this.state.text = "Usuario no encontrado, intente con otro valor a buscar";
                        this.showMessage();
                    }
                } else {
                    this.state.text = "Ingrese un valor a buscar";
                    this.showMessage();
                }
            }
        }

        showMessage() {
            const notif = this.state.text;
            this.state.notifs.push(notif);
            setTimeout(() => {
                var index = this.state.notifs.indexOf(notif);
                this.state.notifs.splice(index, 1);
            }, 3000);
        }

        async checkIn(ev) {
            const user = this.users.find((t) => t.id === ev.detail.id);
            this.state.text = "Bienvenido "+ user.userName;
            const newLog = await this.env.services.rpc({
               model: "report.attendance.trace.log",
               method: "create",
               args: [
                 {
                   partner_id: user.id,
                   psa_id: this.props.session_id,
                 },
               ],
            });
            this.env.bus.trigger('show-message', this.state.text);
            core.bus.trigger('show_message_attendance', this.state.text);
            this.showMessage();
            while (this.users.length > 0) {
                this.users.pop();
            }
        }
    }
    FormView.components = { User, NotificationList, AsyncRoot };

    const ClientAction = AbstractAction.extend(WidgetAdapterMixin, {
        init: function (parent, action) {
            this.session_id = action.context.id;
            this.background_image = action.context.image;
            this._super.apply(this, arguments);
        },
        start() {
            const component = new ComponentWrapper(this, FormView, {
                session_id: this.session_id,
                background_image: this.background_image,
            });
            return component.mount(this.el.querySelector(".o_content"));
        },
    });

    core.action_registry.add("check_in_action", ClientAction);

    return ClientAction;

});