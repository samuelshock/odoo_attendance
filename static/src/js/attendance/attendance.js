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
    check_in() {
      this.trigger("check-in-user", { id: this.props.partner_id.id });
    }
  }

  User.template = tags.xml`
  <div>
    <input type="checkbox" t-att-checked="props.task.isCompleted" t-on-click="toggleTask"/>
    <span><t t-esc="props.task.title"/></span>
    <button class="btn primary" t-on-click="check_in">Check-In</button>
  </div>
  `;

  User.props = ["partner"];


  class Todo extends Component {

    constructor() {
      super(...arguments);
    }

    users = useState([]);
    inputRef = useRef("add-input");

    mounted() {
      this.inputRef.el.focus();
    }

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


    async addTask(ev) {
      // 13 is keycode for ENTER
      if (ev.keyCode === 13) {
        const title = ev.target.value.trim();
        ev.target.value = "";
        if (title) {
          const newTask = await this.env.services.rpc({
            model: "todo",
            method: "create",
            args: [
              {
                name: title,
                completed: false,
              },
            ],
          });
          this.tasks.push({
            id: newTask,
            title: title,
            isCompleted: false,
          });
        }
      }
    }


    async toggleTask(ev) {
      const task = this.tasks.find((t) => t.id === ev.detail.id);
      task.isCompleted = !task.isCompleted;
      await this.env.services.rpc({
        model: "todo",
        method: "write",
        args: [
          [task.id],
          {
            completed: task.isCompleted,
          },
        ],
      });
    }


    async deleteTask(ev) {
      const index = this.tasks.findIndex((t) => t.id === ev.detail.id);
      this.tasks.splice(index, 1);
      await this.env.services.rpc({
        model: "todo",
        method: "unlink",
        args: [[ev.detail.id]],
      });
    }
  }


  Todo.components = { User };


  Todo.template = tags.xml`
    <div>
      <div class="o_form_view">
        <div class="o_form_sheet_bg">
          <div class="o_form_sheet">
            <div class="todo-app">
              <input placeholder="Enter a new task" t-on-keyup="addTask" t-ref="add-input"/>
              <div class="task-list" t-on-toggle-task="toggleTask" t-on-delete-task="deleteTask">
                <t t-foreach="tasks" t-as="task" t-key="task.id">
                  <Task task="task"/>
                </t>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;


  const ClientAction = AbstractAction.extend(WidgetAdapterMixin, {
    start() {
      const component = new ComponentWrapper(this, FormView);
      return component.mount(this.el.querySelector(".o_content"));
    },
  });

  core.action_registry.add("check_in_action", ClientAction);

  return ClientAction;

});