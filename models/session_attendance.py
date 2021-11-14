# -*- coding: utf-8 -*-
from odoo import api, fields, models


class ReportAttendanceTraceLog(models.Model):
    _name = 'report.attendance.trace.log'

    partner_id = fields.Many2one('res.partner', string='User', index=True, tracking=10)
    check_in = fields.Date(string='Check in date time')
    psa_id = fields.Many2one('session.attendance', string='Molinete de ingreso')


class PointSessionAttendance(models.Model):
    _name = 'session.attendance'

    name = fields.Char(string='Entrada')
    background_login_image = fields.Many2one('ir.attachment', string='Image')
    status_active = fields.Boolean(string='Estado', default=False)
    time_out_to_display = fields.Float(string="Tiempo de espera para mostrar mensaje", default=5.0)
    message_to_show = fields.Char(string='Mensaje a mostrar')

    def _open_check_in_page(self):
        return {
            'res_model': 'session.attendance',
            'type': 'ir.actions.client',
            'tag': 'todo_client_action',
        }

    def _open_standby_screen_page(self):
        pass
