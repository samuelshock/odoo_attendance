odoo.define("odoo_attendance", function (require) {
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
            console.log('-----------');
            console.log(arguments);
            console.log(this);
            this.state = useState({ text: "", notifs: [] });
        }

        async willStart() {
            console.log("willstart");
            console.log(this);
        }

        mounted() {
            this.inputRef.el.focus();
        }

        async searchUser(ev) {
            if (ev.keyCode === 13) {
                const search_text = ev.target.value.trim();
                ev.target.value = "";
                if (search_text) {
                    const fields = ["id", "name", "image_1920"];
                    const users = await this.env.services.rpc({
                        model: "res.partner",
                        method: "search_read",
                        kwargs: {
                            fields,
                        },
                    });
                    console.log(users);
                    if (users.length > 0) {
                        users.map((user) =>
                            this.users.push({
                                id: user.id,
                                userName: user.name,
                                image: user.image,
                            })
                        );
                    } else {
                        this.state.text = "Usuario no encontrado, intente con otro valor a buscar";
                        this.showMessage();
                    }
                    // this.users = [];
                    // this.users.push({
                    //   id: 1,
                    //   userName: 'test',
                    //   image: 'https://image.shutterstock.com/z/stock-photo-old-brick-black-color-wall-vintage-background-1605128917.jpg'
                    // });
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
                 },
               ],
            });
            this.showMessage();
            this.users = useState([]);
        }
    }
    FormView.components = { User, NotificationList, AsyncRoot };

    // class Todo extends Component {
    //
    //   constructor() {
    //     super(...arguments);
    //   }
    //
    //   users = useState([]);
    //   inputRef = useRef("add-input");
    //
    //   mounted() {
    //     this.inputRef.el.focus();
    //   }

    // async willStart() {
    //   // TODO: Load here the qr code to user
    //   const fields = ["id", "name", "completed"];
    //   const users = await this.env.services.rpc({
    //     model: "res.partner",
    //     method: "search_read",
    //     kwargs: {
    //       fields,
    //     },
    //   });
    //   tasks.map((task) =>
    //     this.tasks.push({
    //       id: task.id,
    //       title: task.name,
    //       isCompleted: task.completed,
    //     })
    //   );
    // }


    //   async addTask(ev) {
    //     // 13 is keycode for ENTER
    //     if (ev.keyCode === 13) {
    //       const title = ev.target.value.trim();
    //       ev.target.value = "";
    //       if (title) {
    //         const newTask = await this.env.services.rpc({
    //           model: "todo",
    //           method: "create",
    //           args: [
    //             {
    //               name: title,
    //               completed: false,
    //             },
    //           ],
    //         });
    //         this.tasks.push({
    //           id: newTask,
    //           title: title,
    //           isCompleted: false,
    //         });
    //       }
    //     }
    //   }
    //
    //
    //   async toggleTask(ev) {
    //     const task = this.tasks.find((t) => t.id === ev.detail.id);
    //     task.isCompleted = !task.isCompleted;
    //     await this.env.services.rpc({
    //       model: "todo",
    //       method: "write",
    //       args: [
    //         [task.id],
    //         {
    //           completed: task.isCompleted,
    //         },
    //       ],
    //     });
    //   }
    //
    //
    //   async deleteTask(ev) {
    //     const index = this.tasks.findIndex((t) => t.id === ev.detail.id);
    //     this.tasks.splice(index, 1);
    //     await this.env.services.rpc({
    //       model: "todo",
    //       method: "unlink",
    //       args: [[ev.detail.id]],
    //     });
    //   }
    // }
    //
    //
    // Todo.components = { User };
    //
    //
    // Todo.template = tags.xml`
    //   <div>
    //     <div class="o_form_view">
    //       <div class="o_form_sheet_bg">
    //         <div class="o_form_sheet">
    //           <div class="todo-app">
    //             <input placeholder="Enter a new task" t-on-keyup="addTask" t-ref="add-input"/>
    //             <div class="task-list" t-on-toggle-task="toggleTask" t-on-delete-task="deleteTask">
    //               <t t-foreach="tasks" t-as="task" t-key="task.id">
    //                 <Task task="task"/>
    //               </t>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // `;


    const ClientAction = AbstractAction.extend(WidgetAdapterMixin, {
        init: function (parent, action) {
            console.log(parent);
            console.log(action);
            this.session_id = action.context.id;
            this.background_image = action.context.image;
            this._super.apply(this, arguments);
        },
        start() {
            console.log("************");
            console.log(this);
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