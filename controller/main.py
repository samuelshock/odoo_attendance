# -*- coding: utf-8 -*-
from odoo.http import content_disposition, Controller, request, route
from odoo.addons.portal.controllers.portal import CustomerPortal

File_Type = ['application/pdf', 'image/jpeg', 'image/png']  # allowed file type


class CustomPortalTemplateRender(CustomerPortal):
    MANDATORY_BILLING_FIELDS = []
    OPTIONAL_BILLING_FIELDS = ["zipcode", "state_id", "vat", "company_name", "image_1920", "name", "email",
                               "phone", "city", "country_id"]

    _items_per_page = 20

    @route(['/user/profile/<string:user_id>'], type='http', auth='public', website=True)
    def account(self, user_id, redirect=None, **post):
        values = self._prepare_portal_layout_values()
        partner = request.env['res.partner'].sudo().search([
            ('x_user_rfid', '=', user_id)
        ], limit=1)
        values.update({
            'error': {},
            'error_message': [],
        })

        countries = request.env['res.country'].sudo().search([])
        states = request.env['res.country.state'].sudo().search([])
        industries = request.env['res.partner.industry'].sudo().search([])

        values.update({
            'partner': partner,
            'countries': countries,
            'states': states,
            'industries': industries,
            'has_check_vat': hasattr(request.env['res.partner'], 'check_vat'),
            'redirect': redirect,
            'page_name': 'my_details',
        })

        response = request.render("odoo_attendance.portal_user_profile", values)
        response.headers['X-Frame-Options'] = 'DENY'
        return response
