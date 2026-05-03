import os
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite:///./test_suite.db'
os.environ['AUTO_CREATE_TABLES'] = 'true'
os.environ['APP_ENV'] = 'development'
os.environ['BOOTSTRAP_ADMIN_ENABLED'] = 'true'
os.environ['BOOTSTRAP_ADMIN_USERNAME'] = 'admin'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'admin@example.com'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'Password123'
os.environ['SESSION_SECRET_KEY'] = 'test-suite-secret'
os.environ['FRONTEND_ERROR_REPORTING_ENABLED'] = 'true'

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, select

from app.main import app
from app.core.database import engine, import_model_metadata
from app.models.admin_audit_log import AdminAuditLog
from app.models.role import Role
from app.models.user_account import UserAccount
from app.models.user_session import UserSession
from app.services.auth import delete_user_sessions, ensure_bootstrap_admin, purge_expired_sessions


class ApiFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        import_model_metadata()

    def setUp(self) -> None:
        SQLModel.metadata.drop_all(engine)
        SQLModel.metadata.create_all(engine)
        with Session(engine) as session:
            ensure_bootstrap_admin(session)
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self) -> None:
        self.client.__exit__(None, None, None)

    @classmethod
    def tearDownClass(cls) -> None:
        engine.dispose()
        test_db = Path('test_suite.db')
        if test_db.exists():
            test_db.unlink()

    def login_admin(self) -> tuple[dict[str, str], dict[str, str]]:
        response = self.client.post(
            '/api/v1/auth/login',
            json={'email': 'admin@example.com', 'password': 'Password123'},
        )
        self.assertEqual(response.status_code, 200, response.text)
        csrf = response.cookies.get('cargonest_csrf')
        self.assertTrue(csrf)
        return (
            {'X-CSRF-Token': csrf},
            {'cargonest_session': response.cookies.get('cargonest_session', ''), 'cargonest_csrf': csrf},
        )

    def create_role(self, headers: dict[str, str], cookies: dict[str, str], name: str = 'operator') -> int:
        response = self.client.post(
            '/api/v1/admin/roles',
            headers=headers,
            cookies=cookies,
            json={'name': name, 'description': f'{name} role'},
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['id']

    def create_user(
        self,
        headers: dict[str, str],
        cookies: dict[str, str],
        *,
        username: str = 'worker1',
        email: str = 'worker1@example.com',
        allowed_forms: list[str] | None = None,
    ) -> int:
        role_id = self.create_role(headers, cookies, name=f'{username}_role')
        response = self.client.post(
            '/api/v1/admin/users',
            headers=headers,
            cookies=cookies,
            json={
                'username': username,
                'email': email,
                'password': 'Password123',
                'role_id': role_id,
                'allowed_forms': allowed_forms or ['overview'],
                'is_active': True,
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()['id']

    def login_user(self, email: str, password: str = 'Password123') -> tuple[dict[str, str], dict[str, str]]:
        response = self.client.post('/api/v1/auth/login', json={'email': email, 'password': password})
        self.assertEqual(response.status_code, 200, response.text)
        csrf = response.cookies.get('cargonest_csrf')
        self.assertTrue(csrf)
        return (
            {'X-CSRF-Token': csrf},
            {'cargonest_session': response.cookies.get('cargonest_session', ''), 'cargonest_csrf': csrf},
        )

    def test_auth_login_sets_session_cookie_and_returns_current_user(self) -> None:
        response = self.client.post(
            '/api/v1/auth/login',
            json={'email': 'admin@example.com', 'password': 'Password123'},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn('cargonest_session', response.cookies)
        self.assertIn('cargonest_csrf', response.cookies)

        me = self.client.get('/api/v1/auth/me', cookies=response.cookies)
        self.assertEqual(me.status_code, 200, me.text)
        payload = me.json()
        self.assertEqual(payload['user']['email'], 'admin@example.com')
        self.assertEqual(payload['user']['role_name'], 'admin')

    def test_admin_can_create_and_update_user_and_audit_log_is_written(self) -> None:
        headers, cookies = self.login_admin()
        role_id = self.create_role(headers, cookies, name='supervisor')

        create_response = self.client.post(
            '/api/v1/admin/users',
            headers=headers,
            cookies=cookies,
            json={
                'username': 'worker1',
                'email': 'worker1@example.com',
                'password': 'Password123',
                'role_id': role_id,
                'allowed_forms': ['overview'],
                'is_active': True,
            },
        )
        self.assertEqual(create_response.status_code, 200, create_response.text)
        user_id = create_response.json()['id']

        update_response = self.client.patch(
            f'/api/v1/admin/users/{user_id}',
            headers=headers,
            cookies=cookies,
            json={'allowed_forms': ['overview', 'shipment'], 'is_active': False},
        )
        self.assertEqual(update_response.status_code, 200, update_response.text)
        payload = update_response.json()
        self.assertEqual(payload['allowed_forms'], ['overview', 'shipment'])
        self.assertFalse(payload['is_active'])

        audit_logs = self.client.get('/api/v1/admin/audit-logs?limit=10', cookies=cookies)
        self.assertEqual(audit_logs.status_code, 200, audit_logs.text)
        actions = [item['action'] for item in audit_logs.json()]
        self.assertIn('role_created', actions)
        self.assertIn('user_created', actions)
        self.assertIn('user_updated', actions)

        with Session(engine) as session:
            self.assertGreater(len(session.exec(select(AdminAuditLog)).all()), 0)
            user = session.get(UserAccount, user_id)
            self.assertIsNotNone(user)
            self.assertEqual(user.allowed_forms, ['overview', 'shipment'])

    def test_admin_update_rejects_duplicate_email_with_validation_error(self) -> None:
        headers, cookies = self.login_admin()
        self.create_user(headers, cookies, username='worker1', email='worker1@example.com')
        second_user_id = self.create_user(headers, cookies, username='worker2', email='worker2@example.com')

        response = self.client.patch(
            f'/api/v1/admin/users/{second_user_id}',
            headers=headers,
            cookies=cookies,
            json={'email': 'worker1@example.com'},
        )
        self.assertEqual(response.status_code, 400, response.text)
        self.assertEqual(response.json()['detail'], 'Email is already in use.')

    def test_session_cleanup_removes_expired_records_without_touching_active_ones(self) -> None:
        with Session(engine) as session:
            active_session = UserSession(
                user_id=1,
                token='active-token',
                expires_at=datetime.now(UTC) + timedelta(hours=2),
            )
            expired_session = UserSession(
                user_id=1,
                token='expired-token',
                expires_at=datetime.now(UTC) - timedelta(minutes=5),
            )
            other_user_session = UserSession(
                user_id=2,
                token='other-token',
                expires_at=datetime.now(UTC) + timedelta(hours=2),
            )
            session.add(active_session)
            session.add(expired_session)
            session.add(other_user_session)
            session.commit()

            purge_expired_sessions(session)
            remaining_tokens = {item.token for item in session.exec(select(UserSession)).all()}
            self.assertEqual(remaining_tokens, {'active-token', 'other-token'})

            delete_user_sessions(session, 1, except_token='active-token')
            final_tokens = {item.token for item in session.exec(select(UserSession)).all()}
            self.assertEqual(final_tokens, {'active-token', 'other-token'})

    def test_role_access_blocks_unauthorized_form_routes(self) -> None:
        admin_headers, admin_cookies = self.login_admin()
        self.create_user(
            admin_headers,
            admin_cookies,
            username='limited',
            email='limited@example.com',
            allowed_forms=['overview'],
        )
        user_headers, user_cookies = self.login_user('limited@example.com')

        forbidden = self.client.get('/api/v1/forms/shipment', cookies=user_cookies)
        self.assertEqual(forbidden.status_code, 403, forbidden.text)

        allowed = self.client.get('/api/v1/forms/overview/all', cookies=user_cookies)
        self.assertEqual(allowed.status_code, 200, allowed.text)

        # CSRF header is only needed for mutating requests; this keeps the helper exercised.
        self.assertIn('X-CSRF-Token', user_headers)

    def test_purchase_order_and_prefill_flow_work_end_to_end(self) -> None:
        headers, cookies = self.login_admin()

        purchase_order_payload = {
            'payload': {
                'fields': {
                    'cargo_no': 'CGN-9001',
                    'plant': 'Plant 1',
                    'year': '2026 - 2027',
                    'buyer': 'BlueWave Imports',
                    'agent': 'Skyline Exports',
                    'invoice_no': 'INV-9001',
                    'po_no': 'PO-9001',
                    'pi_date': '03-05-2026',
                    'pi_no': 'PI-9001',
                    'po_date': '03-05-2026',
                    'po_received': 'Received',
                    'po_validity': '60 Days',
                    'payment_mode': 'TT',
                    'payment_term': 'Net 30',
                    'pod_term': 'FOB',
                    'pod': 'Tokyo',
                    'country': 'Japan',
                    'region': 'Asia',
                    'final_destination': 'Tokyo Warehouse',
                    'other_info': 'Ready for production',
                    'region_notes': 'Cold chain maintained',
                },
                'extra': {
                    'product_rows': [
                        {
                            'brand': 'Brand A',
                            'product': 'Shrimp',
                            'packing': '10x1',
                            'glaze': '10%',
                            'grade': 'A',
                            'no_of_mc': '100',
                            'qty_in_kg': '1000',
                            'price': '12.5',
                        }
                    ]
                },
            }
        }

        save_po = self.client.post('/api/v1/forms/purchase_order', headers=headers, cookies=cookies, json=purchase_order_payload)
        self.assertEqual(save_po.status_code, 200, save_po.text)

        reglazing_payload = {
            'payload': {
                'fields': {
                    'cargo_no': 'CGN-9001',
                    'po_no': 'PO-9001',
                    'invoice_no': 'INV-9001',
                    'plant': 'Plant 1',
                    'buyer_name': 'BlueWave Imports',
                    'assortment': 'Assorted Mix',
                },
                'extra': {
                    'reglazing_rows': [
                        {
                            'brand': 'Brand A',
                            'product': 'Shrimp',
                            'packing': '10x1',
                            'glaze': '10%',
                            'grade': 'A',
                            'no_of_mc': '100',
                            'qty_in_kg': '1000',
                            'price': '12.5',
                            'reglazing_in_qty': '1000',
                            'reglazing_done': '500',
                            'reglazing_balance': '500',
                            'location_1_qty': '250',
                            'location_2_qty': '250',
                        }
                    ]
                },
            }
        }

        save_reglazing = self.client.post(
            '/api/v1/forms/stock_reglazing',
            headers=headers,
            cookies=cookies,
            json=reglazing_payload,
        )
        self.assertEqual(save_reglazing.status_code, 200, save_reglazing.text)

        prefill = self.client.get('/api/v1/forms/prefill/stock_reglazing/CGN-9001', cookies=cookies)
        self.assertEqual(prefill.status_code, 200, prefill.text)
        payload = prefill.json()
        self.assertEqual(payload['fields']['buyer_name'], 'BlueWave Imports')
        self.assertEqual(payload['extra']['reglazing_rows'][0]['product'], 'Shrimp')
        self.assertEqual(payload['extra']['reglazing_rows'][0]['reglazing_done'], '500')

    def test_form_validation_rejects_invalid_payload(self) -> None:
        headers, cookies = self.login_admin()

        invalid_payload = {
            'payload': {
                'fields': {
                    'cargo_no': 'CGN-1',
                    'po_no': 'PO-1',
                    'invoice_no': 'INV-1',
                },
                'extra': {
                    'pht_rows': [
                        {
                            'brand': 'Brand A',
                            'product': 'Shrimp',
                            'packing': '10x1',
                            'glaze': '10%',
                            'grade': 'A',
                            'no_of_mc': '100',
                            'qty_in_kg': '1000',
                            'price': '12',
                            'type_of_pht': 'Marine',
                            'if_bap': 'Yes',
                            'qty_rm': '1000',
                            'pht_no': 'PHT-1',
                        }
                    ]
                },
            }
        }

        response = self.client.post('/api/v1/forms/stock_pht', headers=headers, cookies=cookies, json=invalid_payload)
        self.assertEqual(response.status_code, 422, response.text)
        self.assertIn('type_of_pht_file', response.json()['detail'])


if __name__ == '__main__':
    unittest.main()
