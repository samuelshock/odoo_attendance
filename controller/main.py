from odoo import http, _
from odoo.http import request


class AttendanceController(http.Controller):

    @http.route('/profile/user/<string:user_id>', type='http', auth="none")
    def main_menu(self, user_id, **kw):
        try_open_sale_order = AttendanceController.try_open_user_profile(user_id)
        if try_open_sale_order:
            return try_open_sale_order
        else:
            return {'warning': 'No user profile to QR %s' % user_id}

    @staticmethod
    def try_open_user_profile(user_id):
        """ If barcode represent a sale type, open the sale"""
        u_id = request.env['res.partner'].sudo().search([
            ('id', '=', user_id)
        ], limit=1)
        if u_id:
            # return request.redirect('/web/my')
            # TODO: crear una pagina de perfil de usuario para odoo community
            return http.local_redirect('/my', keep_hash=True)
        return False
