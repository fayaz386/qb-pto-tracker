--
-- PostgreSQL database dump
--

\restrict qpPXXfLgE9InhjD4V3BjGlPixsib0IZUnKaVpC4QSDkQM5N4YgdTOHnLX03rZjb

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employee_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_notes (
    id integer NOT NULL,
    hotel text NOT NULL,
    employee_key text NOT NULL,
    note text NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    attachment_path text
);


ALTER TABLE public.employee_notes OWNER TO postgres;

--
-- Name: employee_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_notes_id_seq OWNER TO postgres;

--
-- Name: employee_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_notes_id_seq OWNED BY public.employee_notes.id;


--
-- Name: employee_vacation_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_vacation_option (
    hotel text NOT NULL,
    employee text NOT NULL,
    vacation_option_id integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employee_vacation_option OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    employee_key text NOT NULL,
    display_name text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    opening_vac_amount numeric DEFAULT 0,
    opening_vac_hours numeric DEFAULT 0,
    opening_sick_amount numeric DEFAULT 0,
    opening_sick_hours numeric DEFAULT 0,
    vacation_hours_available numeric DEFAULT 0,
    sick_hours_available numeric DEFAULT 0,
    account_number text,
    email text,
    phone text,
    hired_date text,
    birth_date text,
    job_title text,
    address text,
    vacation_used_hours numeric DEFAULT 0,
    vacation_used_amount numeric DEFAULT 0,
    sick_used_hours numeric DEFAULT 0,
    sick_used_amount numeric DEFAULT 0,
    sick_days_used numeric DEFAULT 0,
    bereavement_used_hours numeric DEFAULT 0,
    bereavement_used_amount numeric DEFAULT 0,
    bereavement_days_used numeric DEFAULT 0,
    vacation_days_allowed numeric DEFAULT 0,
    hotel text
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: import_rows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_rows (
    id bigint NOT NULL,
    import_id bigint NOT NULL,
    row_number integer NOT NULL,
    employee_key text,
    status text NOT NULL,
    message text,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.import_rows OWNER TO postgres;

--
-- Name: import_rows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_rows_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_rows_id_seq OWNER TO postgres;

--
-- Name: import_rows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_rows_id_seq OWNED BY public.import_rows.id;


--
-- Name: imports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imports (
    id bigint NOT NULL,
    imported_by text NOT NULL,
    source_filename text,
    source_type text DEFAULT 'quickbooks_csv'::text NOT NULL,
    as_of_date date,
    vacation_col text,
    sick_col text,
    rows_total integer DEFAULT 0 NOT NULL,
    rows_ok integer DEFAULT 0 NOT NULL,
    rows_skipped integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    report_kind text,
    source_csv text,
    stored_filename text,
    hotel text,
    sick_amount_col text,
    year integer
);


ALTER TABLE public.imports OWNER TO postgres;

--
-- Name: imports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imports_id_seq OWNER TO postgres;

--
-- Name: imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imports_id_seq OWNED BY public.imports.id;


--
-- Name: manual_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manual_entries (
    id integer NOT NULL,
    hotel text NOT NULL,
    employee text NOT NULL,
    year integer NOT NULL,
    type text NOT NULL,
    hours numeric,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    from_date date,
    to_date date,
    days numeric,
    allocated_year integer
);


ALTER TABLE public.manual_entries OWNER TO postgres;

--
-- Name: manual_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manual_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manual_entries_id_seq OWNER TO postgres;

--
-- Name: manual_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manual_entries_id_seq OWNED BY public.manual_entries.id;


--
-- Name: pto_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pto_balances (
    id bigint NOT NULL,
    employee_id bigint NOT NULL,
    import_id bigint NOT NULL,
    as_of_date date,
    vacation_hours numeric(12,2),
    sick_hours numeric(12,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sick_amount numeric,
    bereavement_hours numeric,
    bereavement_amount numeric,
    vacation_amount numeric,
    vacation_used_hours numeric DEFAULT 0,
    vacation_used_amount numeric DEFAULT 0,
    sick_used_hours numeric DEFAULT 0,
    sick_used_amount numeric DEFAULT 0,
    sick_days_used numeric DEFAULT 0,
    bereavement_used_hours numeric DEFAULT 0,
    bereavement_used_amount numeric DEFAULT 0,
    bereavement_days_used numeric DEFAULT 0
);


ALTER TABLE public.pto_balances OWNER TO postgres;

--
-- Name: pto_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pto_balances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pto_balances_id_seq OWNER TO postgres;

--
-- Name: pto_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pto_balances_id_seq OWNED BY public.pto_balances.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    token text NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ip_address text,
    user_agent text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings_hotels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings_hotels (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.settings_hotels OWNER TO postgres;

--
-- Name: settings_hotels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_hotels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_hotels_id_seq OWNER TO postgres;

--
-- Name: settings_hotels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_hotels_id_seq OWNED BY public.settings_hotels.id;


--
-- Name: settings_ip_allowlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings_ip_allowlist (
    id integer NOT NULL,
    ip_address text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.settings_ip_allowlist OWNER TO postgres;

--
-- Name: settings_ip_allowlist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_ip_allowlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_ip_allowlist_id_seq OWNER TO postgres;

--
-- Name: settings_ip_allowlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_ip_allowlist_id_seq OWNED BY public.settings_ip_allowlist.id;


--
-- Name: settings_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings_types (
    id integer NOT NULL,
    name text NOT NULL,
    max_allowed numeric,
    min_allowed numeric,
    hotel text
);


ALTER TABLE public.settings_types OWNER TO postgres;

--
-- Name: settings_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_types_id_seq OWNER TO postgres;

--
-- Name: settings_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_types_id_seq OWNED BY public.settings_types.id;


--
-- Name: settings_vacation_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings_vacation_options (
    id integer NOT NULL,
    label text NOT NULL,
    max_allowed numeric NOT NULL
);


ALTER TABLE public.settings_vacation_options OWNER TO postgres;

--
-- Name: settings_vacation_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_vacation_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_vacation_options_id_seq OWNER TO postgres;

--
-- Name: settings_vacation_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_vacation_options_id_seq OWNED BY public.settings_vacation_options.id;


--
-- Name: settings_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings_years (
    id integer NOT NULL,
    year integer NOT NULL
);


ALTER TABLE public.settings_years OWNER TO postgres;

--
-- Name: settings_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_years_id_seq OWNER TO postgres;

--
-- Name: settings_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_years_id_seq OWNED BY public.settings_years.id;


--
-- Name: sync_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_history (
    id integer NOT NULL,
    username text,
    details text,
    status text,
    created_at timestamp with time zone DEFAULT now(),
    hotel text
);


ALTER TABLE public.sync_history OWNER TO postgres;

--
-- Name: sync_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_history_id_seq OWNER TO postgres;

--
-- Name: sync_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_history_id_seq OWNED BY public.sync_history.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key text NOT NULL,
    value text
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    salt text NOT NULL,
    role text NOT NULL,
    first_name text,
    last_name text,
    created_at timestamp with time zone DEFAULT now(),
    is_blocked boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: employee_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_notes ALTER COLUMN id SET DEFAULT nextval('public.employee_notes_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: import_rows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_rows ALTER COLUMN id SET DEFAULT nextval('public.import_rows_id_seq'::regclass);


--
-- Name: imports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports ALTER COLUMN id SET DEFAULT nextval('public.imports_id_seq'::regclass);


--
-- Name: manual_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entries ALTER COLUMN id SET DEFAULT nextval('public.manual_entries_id_seq'::regclass);


--
-- Name: pto_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pto_balances ALTER COLUMN id SET DEFAULT nextval('public.pto_balances_id_seq'::regclass);


--
-- Name: settings_hotels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_hotels ALTER COLUMN id SET DEFAULT nextval('public.settings_hotels_id_seq'::regclass);


--
-- Name: settings_ip_allowlist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_ip_allowlist ALTER COLUMN id SET DEFAULT nextval('public.settings_ip_allowlist_id_seq'::regclass);


--
-- Name: settings_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_types ALTER COLUMN id SET DEFAULT nextval('public.settings_types_id_seq'::regclass);


--
-- Name: settings_vacation_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_vacation_options ALTER COLUMN id SET DEFAULT nextval('public.settings_vacation_options_id_seq'::regclass);


--
-- Name: settings_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_years ALTER COLUMN id SET DEFAULT nextval('public.settings_years_id_seq'::regclass);


--
-- Name: sync_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_history ALTER COLUMN id SET DEFAULT nextval('public.sync_history_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: employee_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_notes (id, hotel, employee_key, note, created_by, created_at, attachment_path) FROM stdin;
1	Holiday Inn Express & Suites - 5599 Ambler	[object Object]	payroll#2 2026. paid pending vacation from 2025 $1,374.60	System	2026-01-26 07:32:23.684913-05	\N
7	Holiday Inn Express & Suites - 5599 Ambler	Florina Gjokaj	payroll#02. pay out pending vacation from 2025 $1,374.60	admin	2026-01-26 08:00:04.432869-05	/uploads/notes/note-1769432404245-96018270.pdf
\.


--
-- Data for Name: employee_vacation_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_vacation_option (hotel, employee, vacation_option_id, updated_at) FROM stdin;
Holiday Inn & Suites -2565 Argentia	Samanka Fernando	1	2025-12-31 15:46:57.948911-05
Holiday Inn & Suites -2565 Argentia	Sapna Sapna	1	2025-12-31 15:46:57.950235-05
Holiday Inn & Suites -2565 Argentia	Satinder Kaur Jammu	1	2025-12-31 15:46:57.951317-05
Holiday Inn & Suites -2565 Argentia	Syed Kashif Ali	1	2025-12-31 15:46:57.957288-05
Holiday Inn & Suites -2565 Argentia	Tarminder Kaur Chandi	1	2025-12-31 15:46:57.958306-05
Holiday Inn & Suites -2565 Argentia	Timothy Wood	1	2025-12-31 15:46:57.95928-05
Holiday Inn & Suites -2565 Argentia	Tyronne Perera	1	2025-12-31 15:46:57.96023-05
Holiday Inn Express & Suites - 5599 Ambler	Angelisa Delos Reyes	1	2025-12-31 16:05:11.581912-05
Holiday Inn Express & Suites - 5599 Ambler	Anil Vansil	1	2025-12-31 16:05:11.583009-05
Holiday Inn Express & Suites - 5599 Ambler	Anjela Katoch	1	2025-12-31 16:05:11.584101-05
Holiday Inn Express & Suites - 5599 Ambler	Aditya Gakkhar	1	2025-12-31 16:05:11.572519-05
Holiday Inn Express & Suites - 5599 Ambler	Akhtar Nasim	1	2025-12-31 16:05:11.574877-05
Holiday Inn Express & Suites - 5599 Ambler	Akshay Patel	1	2025-12-31 16:05:11.576314-05
Holiday Inn Express & Suites - 5599 Ambler	Ambika Thapa	1	2025-12-31 16:05:11.577445-05
Holiday Inn Express & Suites - 5599 Ambler	Amparo Jurado	1	2025-12-31 16:05:11.578521-05
Holiday Inn Express & Suites - 5599 Ambler	Analee Santos	1	2025-12-31 16:05:11.579708-05
Holiday Inn & Suites -2565 Argentia	Aashika Rizal	1	2025-12-31 15:46:57.889781-05
Holiday Inn & Suites -2565 Argentia	Angelou Casquijo	1	2025-12-31 15:46:57.89225-05
Holiday Inn & Suites -2565 Argentia	Anmolpreet Sidhu	1	2025-12-31 15:46:57.893788-05
Holiday Inn & Suites -2565 Argentia	Atup Ma Concepcion	1	2025-12-31 15:46:57.896566-05
Holiday Inn & Suites -2565 Argentia	Baljinder Kaur	1	2025-12-31 15:46:57.897862-05
Holiday Inn & Suites -2565 Argentia	Brianna Spence	1	2025-12-31 15:46:57.899137-05
Holiday Inn & Suites -2565 Argentia	Arshpreet Kaur	1	2025-12-31 15:46:57.895225-05
Holiday Inn & Suites -2565 Argentia	Chris-Solo Capuy	1	2025-12-31 15:46:57.900329-05
Holiday Inn & Suites -2565 Argentia	Cindy Bryce	1	2025-12-31 15:46:57.901592-05
Holiday Inn & Suites -2565 Argentia	Fedir Hladkov	1	2025-12-31 15:46:57.905426-05
Holiday Inn & Suites -2565 Argentia	Govinda Shiwakoti	1	2025-12-31 15:46:57.906503-05
Holiday Inn & Suites -2565 Argentia	Harshan Coswatte	1	2025-12-31 15:46:57.908035-05
Holiday Inn & Suites -2565 Argentia	Jerzy Far	1	2025-12-31 15:46:57.91428-05
Holiday Inn & Suites -2565 Argentia	Joan Javier	1	2025-12-31 15:46:57.915797-05
Holiday Inn & Suites -2565 Argentia	Kamaljit Kaur Mutti	1	2025-12-31 15:46:57.917513-05
Holiday Inn & Suites -2565 Argentia	Kristopher Howse	1	2025-12-31 15:46:57.918896-05
Holiday Inn & Suites -2565 Argentia	Courtney Nicholas	1	2025-12-31 15:46:57.902891-05
Holiday Inn & Suites -2565 Argentia	Hassan Naeem	1	2025-12-31 15:46:57.909191-05
Holiday Inn & Suites -2565 Argentia	Husanpreet Kaur Sekhon	1	2025-12-31 15:46:57.910291-05
Holiday Inn & Suites -2565 Argentia	Indra Satria	1	2025-12-31 15:46:57.911401-05
Holiday Inn & Suites -2565 Argentia	Kulwinder Kaur Chandi	1	2025-12-31 15:46:57.920221-05
Holiday Inn & Suites -2565 Argentia	Lauren Murray	1	2025-12-31 15:46:57.921636-05
Holiday Inn & Suites -2565 Argentia	Loi Lac Nguyen	1	2025-12-31 15:46:57.922967-05
Holiday Inn & Suites -2565 Argentia	Loveleen Kaur	1	2025-12-31 15:46:57.924053-05
Holiday Inn & Suites -2565 Argentia	Ma Vina Calumno Callado	1	2025-12-31 15:46:57.925261-05
Holiday Inn & Suites -2565 Argentia	Manjit Pasricha	1	2025-12-31 15:46:57.926611-05
Holiday Inn & Suites -2565 Argentia	Manuel Apolinario	1	2025-12-31 15:46:57.927969-05
Holiday Inn & Suites -2565 Argentia	Marcelina Dallo	1	2025-12-31 15:46:57.929044-05
Holiday Inn & Suites -2565 Argentia	Milanda Gad	1	2025-12-31 15:46:57.932168-05
Holiday Inn & Suites -2565 Argentia	Nadia Guevara	1	2025-12-31 15:46:57.93311-05
Holiday Inn & Suites -2565 Argentia	Oshin Bhujel Magar	1	2025-12-31 15:46:57.934107-05
Holiday Inn & Suites -2565 Argentia	Paramjit Kaur	1	2025-12-31 15:46:57.935439-05
Holiday Inn & Suites -2565 Argentia	Rajmohan Thurairasa	1	2025-12-31 15:46:57.940341-05
Holiday Inn & Suites -2565 Argentia	Ranjit Kaur Thind	1	2025-12-31 15:46:57.941299-05
Holiday Inn & Suites -2565 Argentia	Raquel Tajonera	1	2025-12-31 15:46:57.942241-05
Holiday Inn & Suites -2565 Argentia	Rinakshi Barik	1	2025-12-31 15:46:57.943172-05
Holiday Inn & Suites -2565 Argentia	Sheila Crowther	1	2025-12-31 15:46:57.952739-05
Holiday Inn & Suites -2565 Argentia	Soraya Sanchez	1	2025-12-31 15:46:57.954086-05
Holiday Inn & Suites -2565 Argentia	Stephen Prasad	1	2025-12-31 15:46:57.955222-05
Holiday Inn Express & Suites - 5599 Ambler	Anand Bishpatia	1	2025-12-31 16:05:11.580838-05
Holiday Inn & Suites -2565 Argentia	Damien Flynn	1	2025-12-31 15:46:57.904261-05
Holiday Inn & Suites -2565 Argentia	Jenny Ann Holoyohoy	1	2025-12-31 15:46:57.912417-05
Holiday Inn & Suites -2565 Argentia	Marta Konopka	1	2025-12-31 15:46:57.930224-05
Holiday Inn & Suites -2565 Argentia	Maryam Jaffer	1	2025-12-31 15:46:57.931218-05
Holiday Inn & Suites -2565 Argentia	Patria Taclas Rosello	1	2025-12-31 15:46:57.936626-05
Holiday Inn & Suites -2565 Argentia	Paula Senos	1	2025-12-31 15:46:57.938133-05
Holiday Inn & Suites -2565 Argentia	Rajdeep Kaur Thind	1	2025-12-31 15:46:57.939137-05
Holiday Inn & Suites -2565 Argentia	Riteshkumar Shah	1	2025-12-31 15:46:57.944227-05
Holiday Inn & Suites -2565 Argentia	Roman Ukolov	1	2025-12-31 15:46:57.945947-05
Holiday Inn & Suites -2565 Argentia	Rubina Khan	1	2025-12-31 15:46:57.947311-05
Holiday Inn & Suites -2565 Argentia	Sunveer Singh	1	2025-12-31 15:46:57.956305-05
Holiday Inn Express & Suites - 5599 Ambler	Chris Alfonso	1	2025-12-31 16:05:11.597529-05
Holiday Inn Express & Suites - 5599 Ambler	Christine Pascual	1	2025-12-31 16:05:11.599074-05
Holiday Inn Express & Suites - 5599 Ambler	Claudia Martinez	1	2025-12-31 16:05:11.600755-05
Holiday Inn Express & Suites - 5599 Ambler	Darshan Kaur	1	2025-12-31 16:05:11.60237-05
Holiday Inn Express & Suites - 5599 Ambler	Destiny Marsman-Brown	1	2025-12-31 16:05:11.603765-05
Holiday Inn Express & Suites - 5599 Ambler	Elise Valeria Ryba Vinasco	1	2025-12-31 16:05:11.60495-05
Holiday Inn Express & Suites - 5599 Ambler	Elsaida Zenelaj	1	2025-12-31 16:05:11.606041-05
Holiday Inn Express & Suites - 5599 Ambler	Filemona Kroni	1	2025-12-31 16:05:11.607204-05
Holiday Inn Express & Suites - 5599 Ambler	Filomena Kinsley	1	2025-12-31 16:05:11.608614-05
Holiday Inn Express & Suites - 5599 Ambler	Florina Gjokaj	1	2025-12-31 16:05:11.609735-05
Holiday Inn Express & Suites - 5599 Ambler	Gagandeep Kaur Brar	1	2025-12-31 16:05:11.610835-05
Holiday Inn Express & Suites - 5599 Ambler	Gautam Saini	1	2025-12-31 16:05:11.611927-05
Holiday Inn Express & Suites - 5599 Ambler	Gurneet Kaur	1	2025-12-31 16:05:11.613037-05
Holiday Inn Express & Suites - 5599 Ambler	Gursimran Kaur	1	2025-12-31 16:05:11.614128-05
Holiday Inn Express & Suites - 5599 Ambler	Harshit Sharma	1	2025-12-31 16:05:11.615159-05
Holiday Inn Express & Suites - 5599 Ambler	Inderjeet Singh Khurmi	1	2025-12-31 16:05:11.616185-05
Holiday Inn Express & Suites - 5599 Ambler	Jaffer Fayazali	1	2025-12-31 16:05:11.617202-05
Holiday Inn Express & Suites - 5599 Ambler	Jagroop Dhillon	1	2025-12-31 16:05:11.618216-05
Holiday Inn Express & Suites - 5599 Ambler	Jaskirat Kaur	1	2025-12-31 16:05:11.619396-05
Holiday Inn Express & Suites - 5599 Ambler	Jasvir Sidhu	1	2025-12-31 16:05:11.620416-05
Holiday Inn Express & Suites - 5599 Ambler	Jose Isidro Saenz Chacon	1	2025-12-31 16:05:11.621413-05
Holiday Inn Express & Suites - 5599 Ambler	Kalp Upadhyay	1	2025-12-31 16:05:11.622409-05
Holiday Inn Express & Suites - 5599 Ambler	Kartik Kartik	1	2025-12-31 16:05:11.623484-05
Holiday Inn Express & Suites - 5599 Ambler	Khyati Patel	1	2025-12-31 16:05:11.624398-05
Holiday Inn Express & Suites - 5599 Ambler	Komalpreet Kaur	1	2025-12-31 16:05:11.625333-05
Holiday Inn Express & Suites - 5599 Ambler	Luis Jurado	1	2025-12-31 16:05:11.627376-05
Holiday Inn Express & Suites - 5599 Ambler	Madalena Gjoka	1	2025-12-31 16:05:11.628386-05
Holiday Inn Express & Suites - 5599 Ambler	Mandaline Pllumaj	1	2025-12-31 16:05:11.62957-05
Holiday Inn Express & Suites - 5599 Ambler	Manpreet Kaur	1	2025-12-31 16:05:11.631714-05
Holiday Inn Express & Suites - 5599 Ambler	Marharyta Stashevska	1	2025-12-31 16:05:11.63377-05
Holiday Inn Express & Suites - 5599 Ambler	Marjorie Francis Sy	1	2025-12-31 16:05:11.635253-05
Holiday Inn Express & Suites - 5599 Ambler	Mary Grace Barro	1	2025-12-31 16:05:11.636565-05
Holiday Inn Express & Suites - 5599 Ambler	Maryam Jaffer	1	2025-12-31 16:05:11.638354-05
Holiday Inn Express & Suites - 5599 Ambler	Meenu Meenu	1	2025-12-31 16:05:11.639543-05
Holiday Inn Express & Suites - 5599 Ambler	Meissa Sokalski	1	2025-12-31 16:05:11.640695-05
Holiday Inn Express & Suites - 5599 Ambler	Mittal Patel	1	2025-12-31 16:05:11.6418-05
Holiday Inn Express & Suites - 5599 Ambler	Mohamed Jaffer	1	2025-12-31 16:05:11.642869-05
Holiday Inn Express & Suites - 5599 Ambler	Muskan Sekhon	1	2025-12-31 16:05:11.644188-05
Holiday Inn Express & Suites - 5599 Ambler	Naman Jain	1	2025-12-31 16:05:11.646429-05
Holiday Inn Express & Suites - 5599 Ambler	Namnish Kaur	1	2025-12-31 16:05:11.647908-05
Holiday Inn Express & Suites - 5599 Ambler	Navjot Singh	1	2025-12-31 16:05:11.648989-05
Holiday Inn Express & Suites - 5599 Ambler	Neel Ashishbhai Patel	1	2025-12-31 16:05:11.650065-05
Holiday Inn Express & Suites - 5599 Ambler	Neha Verma	1	2025-12-31 16:05:11.651142-05
Holiday Inn Express & Suites - 5599 Ambler	Niyati Patel	1	2025-12-31 16:05:11.652206-05
Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	1	2025-12-31 16:05:11.653263-05
Holiday Inn Express & Suites - 5599 Ambler	Parneet Kaur	1	2025-12-31 16:05:11.655298-05
Holiday Inn Express & Suites - 5599 Ambler	Payal Arora	1	2025-12-31 16:05:11.656402-05
Holiday Inn Express & Suites - 5599 Ambler	Payal Patel	1	2025-12-31 16:05:11.657583-05
Holiday Inn Express & Suites - 5599 Ambler	Prabhjot Kaur	1	2025-12-31 16:05:11.658633-05
Holiday Inn Express & Suites - 5599 Ambler	Prathamraj Bihola	1	2025-12-31 16:05:11.660954-05
Holiday Inn Express & Suites - 5599 Ambler	Pravallika Gude	1	2025-12-31 16:05:11.662595-05
Holiday Inn Express & Suites - 5599 Ambler	Preetaman Singh Pahuja	1	2025-12-31 16:05:11.664474-05
Holiday Inn Express & Suites - 5599 Ambler	Premadasa Kumarawadu	1	2025-12-31 16:05:11.666087-05
Holiday Inn Express & Suites - 5599 Ambler	Premawathy Sritharan	1	2025-12-31 16:05:11.667782-05
Holiday Inn Express & Suites - 5599 Ambler	Prudence Christie	1	2025-12-31 16:05:11.669034-05
Holiday Inn Express & Suites - 5599 Ambler	Reet-Inder Bains	1	2025-12-31 16:05:11.670229-05
Holiday Inn Express & Suites - 5599 Ambler	Remo Roy	1	2025-12-31 16:05:11.671419-05
Holiday Inn Express & Suites - 5599 Ambler	Ruja Maharjan	1	2025-12-31 16:05:11.672483-05
Holiday Inn Express & Suites - 5599 Ambler	Sagarika Sharma	1	2025-12-31 16:05:11.673568-05
Holiday Inn Express & Suites - 5599 Ambler	Satvik Abrol	1	2025-12-31 16:05:11.674605-05
Holiday Inn Express & Suites - 5599 Ambler	Sikiru Gaji	1	2025-12-31 16:05:11.675642-05
Holiday Inn Express & Suites - 5599 Ambler	Sikta Sammi	1	2025-12-31 16:05:11.676692-05
Holiday Inn Express & Suites - 5599 Ambler	Simran Kaur Brar	1	2025-12-31 16:05:11.677738-05
Holiday Inn Express & Suites - 5599 Ambler	Simran Sidhu	1	2025-12-31 16:05:11.679013-05
Holiday Inn Express & Suites - 5599 Ambler	Sonia Sonia	1	2025-12-31 16:05:11.680054-05
Holiday Inn Express & Suites - 5599 Ambler	Sukhjeet Kaur	1	2025-12-31 16:05:11.681089-05
Holiday Inn Express & Suites - 5599 Ambler	Sukhjit Kumar	1	2025-12-31 16:05:11.682106-05
Holiday Inn Express & Suites - 5599 Ambler	Sumandeep Kaur	1	2025-12-31 16:05:11.683162-05
Holiday Inn Express & Suites - 5599 Ambler	Apsara Adhikari	1	2025-12-31 16:05:11.587468-05
Holiday Inn Express & Suites - 5599 Ambler	Arsdeep Singh	1	2025-12-31 16:05:11.58853-05
Holiday Inn Express & Suites - 5599 Ambler	Bhavesh Patel	1	2025-12-31 16:05:11.59035-05
Holiday Inn Express & Suites - 5599 Ambler	Bhuvan Sachdeva	1	2025-12-31 16:05:11.591435-05
Holiday Inn Express & Suites - 5599 Ambler	Bikramjit Singh	1	2025-12-31 16:05:11.592694-05
Holiday Inn Express & Suites - 5599 Ambler	Binu Adhikari	1	2025-12-31 16:05:11.593927-05
Holiday Inn Express & Suites - 5599 Ambler	Charmaine Clarke	1	2025-12-31 16:05:11.596226-05
Holiday Inn Express & Suites - 5599 Ambler	Anureet Kaur	1	2025-12-31 16:05:11.585274-05
Holiday Inn Express & Suites - 5599 Ambler	Chandani KP Meegahage	1	2025-12-31 16:05:11.595055-05
Holiday Inn Express & Suites - 5599 Ambler	Charles Oyelowo	1	2026-02-18 08:37:13.271357-05
Holiday Inn Express & Suites - 5599 Ambler	Gurleen Kaur	1	2026-02-18 08:37:13.321329-05
Holiday Inn Express & Suites - 5599 Ambler	Krishna Kumari Ranabhat	1	2025-12-31 16:05:11.626344-05
Holiday Inn Express & Suites - 5599 Ambler	Parmveer Singh	1	2025-12-31 16:05:11.654314-05
Holiday Inn Express & Suites - 5599 Ambler	Prabhjot, Prabhjot	1	2025-12-31 16:05:11.65965-05
Holiday Inn Express & Suites - 5599 Ambler	Sukhbeer Kaur Sangha	1	2026-02-18 08:37:13.423716-05
Holiday Inn Express & Suites - 5599 Ambler	Sunayna Sharma	1	2025-12-31 16:05:11.684191-05
Holiday Inn Express & Suites - 5599 Ambler	Tanisha Sharma	1	2025-12-31 16:05:11.685315-05
Holiday Inn Express & Suites - 5599 Ambler	Tatiana Bravo	1	2025-12-31 16:05:11.686363-05
Holiday Inn Express & Suites - 5599 Ambler	Vaibhav Sharma	1	2025-12-31 16:05:11.687393-05
Holiday Inn Express & Suites - 5599 Ambler	Vaishnavi Gosbal	1	2025-12-31 16:05:11.688592-05
Holiday Inn Express & Suites - 5599 Ambler	Vicente Lopez Toledo	1	2025-12-31 16:05:11.689572-05
Holiday Inn & Suites -2565 Argentia	Jennifer Riches	1	2026-02-18 08:39:58.366919-05
Holiday Inn & Suites -2565 Argentia	Linda Hodeniius	1	2026-02-18 08:39:58.384103-05
Holiday Inn & Suites -2565 Argentia	Rachel Anai Isanan	1	2026-02-18 08:39:58.404797-05
Holiday Inn & Suites -2565 Argentia	Sikta Sammi	1	2026-02-18 08:39:58.420052-05
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_key, display_name, is_active, created_at, updated_at, opening_vac_amount, opening_vac_hours, opening_sick_amount, opening_sick_hours, vacation_hours_available, sick_hours_available, account_number, email, phone, hired_date, birth_date, job_title, address, vacation_used_hours, vacation_used_amount, sick_used_hours, sick_used_amount, sick_days_used, bereavement_used_hours, bereavement_used_amount, bereavement_days_used, vacation_days_allowed, hotel) FROM stdin;
9	Kamaljit Kaur Mutti	Kamaljit Kaur Mutti	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	1576.54	0	0	0	4010.5	0	\N	kamaljitmutti@outlook.com	(416) 904-9482	2019-10-22	1970-08-21	House Keeping Wages..	4593 Crosswinds Dr., Mississauga, ON, L5V 1G4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
22	Paula Senos	Paula Senos	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	492.1399999999999	0	\N	paulasenos1975@gmail.com	647-237-5294	2023-04-03	1975-12-04	Front Desk Wages	285 Enfield Place, Apt#302, Mississauga, ON, L5B 3Y6	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3872	Anand Bishpatia	Anand Bishpatia	f	2025-12-31 16:05:05.888139-05	2025-12-31 16:05:05.888139-05	0	0	0	0	0	0	\N	\N	(647) 995-0146	2022-12-29	1996-12-22	Front Desk Wages	728 Galloway Crescent, Mississauga, ON, L5C 3W1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
4589	Charles Oyelowo	Charles Oyelowo	t	2026-02-17 10:24:38.738241-05	2026-02-17 10:24:38.738241-05	0	0	0	0	92.31	0	\N	oyel0w0@hotmail.com	647-465-9451	2026-02-02	1980-01-28	Sales & Marketing Salary	2484 Parkglen Ave, Oakville, ON, L6M 5B3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
4604	Gurleen Kaur	Gurleen Kaur	t	2026-02-17 10:24:38.762703-05	2026-02-17 10:24:38.762703-05	0	0	0	0	28.4	0	\N	gurkaur1408@gmail.com	514-917-6999	2026-02-10	1996-10-14	Front Desk Wages	45Demaris Drive, Brampton, ON, L6R 3P8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3930	Niyati Patel	Niyati Patel	t	2025-12-31 16:05:05.92051-05	2025-12-31 16:05:05.92051-05	0	0	0	0	1622.5800000000002	0	\N	niyatipatel2711@gmail.com	437-766-1727	2023-09-27	2000-11-27	House Keeping Wages	15 Nathaniel Crescent, Brampton, ON, L6Y 5M2	0	167.2	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
4662	Sukhbeer Kaur Sangha	Sukhbeer Kaur Sangha	t	2026-02-17 10:24:38.792724-05	2026-02-17 10:24:38.792724-05	0	0	0	0	16.48	0	\N	sukhbeerkaur0011@gmail.com	437-982-1320	2026-02-09	2003-08-25	House Keeping Wages	47 Fallingdale Cres., Brampton, ON, L6T 3J5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
31	Aashika Rizal	Aashika Rizal	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-16.120000000000005	0	\N	\N	(647) 867-1963	2022-12-19	2002-05-25	Server Wages	802 Clemens Crescent, Mississauga, ON, L5V 2S9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
4	Courtney Nicholas	Courtney Nicholas	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	2764.64	0	0	0	5423.9400000000005	32	\N	superman.buff23@gmail.com	(647) 228-3581	2019-10-22	1966-12-20	House Person Wages	2250 Homelands DR, #1509., Mississauga, ON, L5K 1G8	0	0	8	165.68	1	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3882	Binu Adhikari	Binu Adhikari	t	2025-12-31 16:05:05.893116-05	2025-12-31 16:05:05.893116-05	0	0	0	0	2794.1600000000003	0	\N	bineyyt@gmail.com	905-460-5144	2023-10-12	1998-04-06	Breakfast Wages	595 Rossellini Drive, Mississauga, ON, L5W 1M5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3889	Destiny Marsman-Brown	Destiny Marsman-Brown	f	2025-12-31 16:05:05.896664-05	2025-12-31 16:05:05.896664-05	0	0	0	0	0	0	\N	destiny.marsman01@hotmail.com	647-261-5343	2024-10-07	2001-10-20	Front Desk Wages	56 Starrview Cres, Mono, ON, L9W 3W9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3893	Filomena Kinsley	Filomena Kinsley	t	2025-12-31 16:05:05.898434-05	2025-12-31 16:05:05.898434-05	42.96	0	0	0	60.440000000000055	0	\N	filomenaottaviano1@gmail.com	(905) 497-1903	2019-11-02	1976-01-02	Room Checker Wages	30 Bramacre Crt, Brampton, ON, L7A 1T5	0	218.75	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
1175	Sukhwinder Kaur	Sukhwinder Kaur	f	2025-12-27 16:45:12.586972-05	2025-12-27 16:45:12.586972-05	0	0	0	0	0	0	\N	\N	(647) 465-7526	2019-10-22	1968-02-21	House Keeping Wages..	4544 Penhallow Rd, Mississauga, ON, L5V 1E7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
4690	Jennifer Riches	Jennifer Riches	t	2026-02-17 10:30:38.289934-05	2026-02-17 10:30:38.289934-05	0	0	0	0	16.54	0	\N	jennifertriches@gmail.com	416-435-2638	2026-02-09	1977-08-30	Server Wages	35 Donal Fitch Cres, Brampton, ON, L7A 5H9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
4698	Linda Hodeniius	Linda Hodeniius	f	2026-02-17 10:30:38.297947-05	2026-02-17 10:30:38.297947-05	0	0	0	0	0	0	\N	hodenius.1952@gmail.com	416-831-7986	2026-02-07	1952-10-12	Server Wages	299 Mill Rd, Apt#1510, Etobicoke, ON, M9C 4V9	0	18.48	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
4714	Rachel Anai Isanan	Rachel Anai Isanan	f	2026-02-17 10:30:38.312946-05	2026-02-17 10:30:38.312946-05	0	0	0	0	0	0	\N	anaiisanan@yahoo.com	416-770-1315	2026-02-02	1992-08-15	Server Wages	966 Inverhouse Drive, unit#1409, Mississauga, ON, L5J 4B6	0	4.05	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3869	Ambika Thapa	Ambika Thapa	t	2025-12-31 16:05:05.886579-05	2025-12-31 16:05:05.886579-05	0	0	0	0	2713.49	0	\N	ambikathapa842@icloud.com	437-559-5298	2023-05-08	1995-06-17	House Keeping Wages	2661 Treviso Crt, Mississauga, ON, L5N 2T3	0	0	16	334.4	2	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
11	Ma Vina Calumno Callado	Ma Vina Calumno Callado	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	2250.29	0	0	0	2162.1400000000003	0	\N	mvcallado@gmail.com	(416) 841-9408	2019-10-03	1974-06-21	House Keeping Wages..	509 - 3151 Jaguar Valley Drive, Mississauga, ON, L5A 2H9	0	1660.12	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
16	Maryam Jaffer	Maryam Jaffer	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	276.99000000000024	0	\N	maryammjaffer@gmail.com	(416) 454-0556	2025-01-06	2001-06-11	Sales & Marketing Salary	223 Webb Drive, Suite 801, Mississauga, ON, L5B 0E8	0	1153.84	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
69	Rajdeep Kaur Thind	Rajdeep Kaur Thind	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-385.4799999999998	8	\N	thindrajdeep026@gmail.com	(289) 241-4335	2022-05-04	1994-01-01	House Keeping Wages..	6 Billingsley Court, Brampton, ON, L6W 4M7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3902	Jaffer Fayazali	Jaffer Fayazali	t	2025-12-31 16:05:05.902538-05	2025-12-31 16:05:05.902538-05	0	0	0	0	0	0	\N	fayaz@west-star.com	647-280-5008	1993-07-01	1970-05-12	Management Salaries	950 Fredonia Drive, Mississauga, ON, L5C 2W4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3897	Gulamabbas Jaffer	Gulamabbas Jaffer	f	2025-12-31 16:05:05.900207-05	2025-12-31 16:05:05.900207-05	0	0	0	0	0	0	\N	gulam@west-star.com	\N	1982-01-01	1943-10-07	Salary	2227 Rosegate Drive, Mississauga, ON, L5M 5A6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3913	Madalena Gjoka	Madalena Gjoka	f	2025-12-31 16:05:05.909198-05	2025-12-31 16:05:05.909198-05	0	0	0	0	-709.5	0	\N	madalenagjoka60@icloud.com	(647) 784-8750	2018-06-12	1960-06-06	House Keeping Wages	24 Eva Rd, #1505, Etobicoke, ON, M9C 2B2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3954	Stephan Stewart	Stephan Stewart	f	2025-12-31 16:05:05.931751-05	2025-12-31 16:05:05.931751-05	0	0	0	0	0	0	\N	\N	(514) 726-3569	2018-02-17	1961-03-03	House Keeping Wages	53 Sparklett Cres, Brampton, ON, L6Z 1M7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3	Cindy Bryce	Cindy Bryce	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	317.26	0	0	0	-185.17999999999938	0	\N	brycecindy@hotmail.com	647-614-2314	2019-10-22	1956-12-30	Server Wages	261 Queen Street South #104, Mississauga, ON, L5N 6Y1	0	256.37	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
86	Timothy Wood	Timothy Wood	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-2867.3900000000003	0	\N	timothywood14@yahoo.com	647-871-3932	2019-10-22	1953-04-15	Chef Wages	199 Windsor Street, Welland, ON, L3C 7E3	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
336	Maintenance Technician OT	Maintenance Technician OT	t	2025-12-24 13:10:54.277895-05	2025-12-24 13:10:54.277895-05	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
55	Loi Lac Nguyen	Loi Lac Nguyen	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	jacksonlac3107@gmail.com	647-571-9954	2024-09-18	1995-07-31	Server Wages	2119 Lawrence Ave West, York, ON, M9N 1H7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
10	Loveleen Kaur	Loveleen Kaur	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	1102.57	0	\N	kloveleen759@gmail.com	647-618-3904	2025-05-27	1999-03-12	Front Desk Wages	37 Gold Hill Road, Brampton, ON, L6X 4V2	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
23	Rajmohan Thurairasa	Rajmohan Thurairasa	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	145.94	0	0	0	240.77999999999975	0	\N	rajthurairasa@gmail.com	(416) 356-6456	2019-10-22	1968-11-26	Line Cook Wages	6779 Glen Erin Dr., Apt#27, Mississauga, ON, L5N 2C1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
71	Ranjit Kaur Thind	Ranjit Kaur Thind	t	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	235.01999999999998	0	\N	rkthind427@gmail.com	289-242-1976	2024-09-11	1977-07-20	House Keeping Wages..	520 Baldwin Cres, Woodstock, ON, N4T 0G4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
24	Rinakshi Barik	Rinakshi Barik	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	78.99	0	0	0	4181.15	0	\N	barikrinakshi@gmail.com	(705) 427-7105	2022-12-05	1988-06-15	House Keeping Wages..	507- 70 Absolute Ave, Mississauga, ON, L4Z 0A4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
75	Roman Ukolov	Roman Ukolov	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	romanukolov@gmail.com	647-285-6181	2023-11-13	1974-06-29	Line Cook Wages	2501 Argintia Rd, Mississauga, ON, L5N 4G8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
26	Samanka Fernando	Samanka Fernando	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	355.26	0	\N	samankaferdi@gmail.com	6479279740	2025-11-01	1991-09-30	House Keeping Wages..	5327 Landsborough Avenue, Mississauga, ON, L5R 3X1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
27	Satinder Kaur Jammu	Satinder Kaur Jammu	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	1366.0700000000002	0	\N	satinder_jammu@hotmail.com	6472979584	2024-03-18	1973-02-10	House Keeping Wages..	4112 Dursley Cres, Mississauga, ON, L4Z 1J7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
28	Soraya Sanchez	Soraya Sanchez	f	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	0	0	\N	ssanchez1599@gmail.com	647-410-0470	2024-09-21	1999-10-15	Server Wages	56 Evans Ave, Etobicoke, ON, M8Z 1H6	0	1033.87	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
29	Stephen Prasad	Stephen Prasad	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	501.27	0	0	0	2834.42	8	\N	steve_prasad@yahoo.ca	(416) 333-0629	2022-05-28	1969-08-31	House Person Wages	14219 Argyll Rd., Georgetown, ON, L7G 5P9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
84	Syed Kashif Ali	Syed Kashif Ali	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-1979.1399999999999	0	\N	\N	(647) 770-5040	2019-10-22	1981-05-15	Front Desk Wages	60 Collowhill Dr. #1001, Etobicoke, ON, M9R 3L5	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
32	Angelou Casquijo	Angelou Casquijo	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-105.27999999999997	16	\N	casquijoangelou6@gmail.com	(437) 256-1655	2022-06-01	1997-01-02	House Keeping Wages..	23- 345 The East Mall, Etobicoke, ON, M9B 3Z8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
33	Anmolpreet Sidhu	Anmolpreet Sidhu	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-528.51	32	\N	preetanmol413@gmail.com	(647) 871-8213	2022-07-28	2004-05-26	House Keeping Wages..	56 Royal Links Circle, Brampton, ON, L6P 2Z9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
34	Arshpreet Kaur	Arshpreet Kaur	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	164.03999999999996	0	\N	sandhuarsh0707@gmail.com	6476088310	2023-06-20	1999-07-07	Front Desk Wages	22 Good Hope Road, Brampton, ON, L6R 3L7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
35	Atup Ma Concepcion	Atup Ma Concepcion	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	18.43	0	\N	\N	(647) 208-4815	2019-03-08	1972-04-08	House Keeping Wages..	2457 Willowburne Dr., Mississauga, ON, L5M 5G1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
1	Baljinder Kaur	Baljinder Kaur	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	2654.13	0	\N	jaggisingh@hotmail.ca	647-993-4700	2024-05-22	1966-07-11	House Keeping Wages..	217 Vodden St W, Brampton, ON, L6X 2W8	0	0	0	0	0	0	0	0	10	Holiday Inn & Suites -2565 Argentia
37	Brianna Spence	Brianna Spence	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	\N	416-830-4049	2023-03-29	2000-02-06	Line Cook Wages	92 Letty Ave, Brampton, ON, L6Y 5C9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
2	Chris-Solo Capuy	Chris-Solo Capuy	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	957.47	0	0	0	1125.3100000000004	0	\N	chris_cap633@yahoo.com	437-255-0005	2022-04-22	1981-10-20	House Keeping Wages..	6060 Snowy Owl Cres, Apt#38, Mississauga, ON, L5N 7K3	0	0	16	309.76	2	0	0	0	0	Holiday Inn & Suites -2565 Argentia
5	Damien Flynn	Damien Flynn	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	521.84	0	0	0	2653.75	0	\N	mflynn2544@sympatico.ca	(647) 615-6836	2022-09-03	1952-09-27	Night Auditor Wages	5 Rochester Court, Brampton, ON, L6X 4P5	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
42	Fedir Hladkov	Fedir Hladkov	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	\N	437-655-1670	2023-01-27	1983-08-16	Maintenance Technician Wages	33 Ovida Ave, Etobicoke, ON, M9B 1ER	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
43	Govinda Shiwakoti	Govinda Shiwakoti	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	\N	647-712-7713	2023-04-24	1978-04-23	Server Wages	9 Perdita Rd, Brampton, ON, L6Y 6B1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
46	Husanpreet Kaur Sekhon	Husanpreet Kaur Sekhon	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-566.9200000000001	32	\N	sekhonhusanpreetkaur@gmail.com	(647) 673-8021	2022-06-17	2002-05-09	House Keeping Wages..	5 Pantomine Blvd, Brampton, ON, L6Y 5M2	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
6	Indra Satria	Indra Satria	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	761.5	0	\N	indrapanthers@yahoo.com	647-870-3613	2024-08-14	1975-07-18	Chef Wages	1011- 2360 Bonner Rd, Mississauga, ON, L5J 2C7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
50	Joan Javier	Joan Javier	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	jjoan0019@gmail.com	647-376-6110	2024-07-23	1996-01-19	Front Desk Wages	913 Ledbury Crescent, Mississauga, ON, L5V 2P8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
17	Milanda Gad	Milanda Gad	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	64.83	0	0	0	-19.940000000000055	0	\N	milandagad88@gmail.com	(226) 581-7994	2022-04-18	1988-01-10	Front Desk Wages	1105 Leger Way, #109, Milton, ON, L9E 1K7	0	312.23	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
20	Paramjit Kaur	Paramjit Kaur	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	1945.15	0	\N	parmkaur478@gmail.com	365-378-3100	2024-07-26	1981-03-16	House Keeping Wages..	31 Blue Lake Ave, Brampton, ON, L6X 4W8	0	0	8	154.88	1	0	0	0	0	Holiday Inn & Suites -2565 Argentia
19	Oshin Bhujel Magar	Oshin Bhujel Magar	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	495.96	0	0	0	320.97999999999956	0	\N	oshinmagar24@gmail.com	(437) 421-2301	2022-06-07	1999-02-12	Front Desk Wages	91 Ridgemount Rd, Etobicoke, ON, M9P 1C7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
72	Raquel Tajonera	Raquel Tajonera	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-198.12000000000012	32	\N	wraquel1805@yahoo.com	(647) 978-5134	2022-09-15	1982-08-18	House Keeping Wages..	1235 Turner Drive, Milton, ON, L9T 6C3	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
21	Patria Taclas Rosello	Patria Taclas Rosello	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	641.02	0	0	0	-73.09000000000003	16	\N	patria_rosello@yahoo.com	416-315-5253	2021-11-14	1970-05-06	House Keeping Wages..	16 Keats Terrace, Brampton, ON, L7A 3N3	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
78	Sapna Sapna	Sapna Sapna	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	sapnabhatia333@gmail.com	289-501-7046	2023-03-04	1995-07-20	House Keeping Wages..	50 Unwind crescent., Brampton, ON, L6X 5J8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
1161	Ramona Patnubay	Ramona Patnubay	f	2025-12-27 16:45:12.578842-05	2025-12-27 16:45:12.578842-05	0	0	0	0	0	0	\N	\N	(416) 668-5623	2022-04-19	1975-06-13	House Keeping Wages..	503 Balmoral Dr., #217, Brampton, ON, L6T 1W2	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
83	Sunveer Singh	Sunveer Singh	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	parasmaur@gmail.com	647-513-7362	2023-09-02	2001-11-29	Server Wages	119 Desert Sand Dr, Brampton, ON, L6R 1V7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
25	Riteshkumar Shah	Riteshkumar Shah	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	2400.01	0	0	0	1220.4300000000003	0	\N	riteshnshah@gmail.com	647-887-5051	2022-03-28	1977-09-16	General Manager Salary	12 Calm Waters Cres, Brampton, ON, L6V 4R9	0	1307.69	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
80	Sheila Crowther	Sheila Crowther	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-284.92999999999984	0	\N	scacanada@hotmail.com	905-306-8452	2020-10-22	1953-08-26	Server Wages	1112-350 Webb Dr., Mississauga, ON, L5B 3W4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
1172	Shrey Shrey	Shrey Shrey	f	2025-12-27 16:45:12.585306-05	2025-12-27 16:45:12.585306-05	0	0	0	0	0	0	\N	\N	437-286-8146	2023-04-06	2002-12-09	Front Desk Wages	164 Allegro Drive, Brampton, ON, L6Y 5Y6	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
45	Hassan Naeem	Hassan Naeem	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	48.15	0	\N	\N	647-937-3437	2023-04-12	2002-02-16	Front Desk Wages	922 Ledbury Crescent, Mississauga, ON, L5V 2P8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
87	Tyronne Perera	Tyronne Perera	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-1198.3800000000006	0	\N	typerera03@hotmail.com	(647) 328-0258	2022-09-10	1951-03-24	House Keeping Manager Salary	31 Balmoral Drive, Brampton, ON, L6T 1V2	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
8	Jerzy Far	Jerzy Far	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	1722.0699999999997	0	\N	jerryfar63@gmail.com	(416) 249-8928	2016-06-16	1957-04-22	Maintenance Technician Wages	39 Richview Road, #508, Etobicoke, ON, M9A 4M7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
44	Harshan Coswatte	Harshan Coswatte	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-956.1699999999998	8	\N	\N	(647) 668-4830	2022-02-06	1964-05-27	House Person Wages	3356 Erin Centre Blvd., Mississauga, ON, L5M 8C3	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
53	Kulwinder Kaur Chandi	Kulwinder Kaur Chandi	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-2327.99	0	\N	kinderchandi@gmail.com	647-762-3710	2019-10-22	1959-07-28	House Keeping Wages..	197 Kingsbridge Garden Circle, Mississauga, ON, L5R 1L6	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
7	Jenny Ann Holoyohoy	Jenny Ann Holoyohoy	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	431.42	0	0	0	-361.81999999999994	0	\N	holoyohoy.j@yahoo.com	416-877-8639	2021-11-13	1979-05-28	Laundry Wages	1303 Wilson Ave, North York, ON, M3M 1J1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
52	Kristopher Howse	Kristopher Howse	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-199.87999999999994	0	\N	\N	(416) 821-2258	2022-06-18	2005-12-12	Server Wages	3134 Plum Tree Crescent, Mississauga, ON, L5N 4X1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
12	Manjit Pasricha	Manjit Pasricha	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	255.6	0	0	0	1194.5500000000002	0	\N	manjitpasricha26@gmail.com	(416) 270-5640	2022-04-05	1956-10-26	House Keeping Wages..	14 Pika Trail, Brampton, ON, L6R 2X1	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
54	Lauren Murray	Lauren Murray	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	206.76	0	\N	lauren.lpm05@hotmail.com	416-836-4456	2023-10-07	2005-05-13	Server Wages	3087 Spring Creek Crescent, Mississauga, ON, L5N 4R8	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
14	Marcelina Dallo	Marcelina Dallo	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	3879.98	0	0	0	-421.0899999999983	0	\N	erommeldallo@gmail.com	905-897-6905	2020-10-20	1959-06-25	Laundry Wages	66 Voltarie Cres, Mississauga, ON, L5A 2A4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
13	Manuel Apolinario	Manuel Apolinario	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	235.92999999999984	0	\N	manny134679@gmail.com	6474473048	2023-02-06	1963-07-13	Line Cook Wages	3152 Shadetree Dr., Mississauga, ON, L5N 6P3	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
15	Marta Konopka	Marta Konopka	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	0	0	0	0	457.1	0	\N	martakonopka05@gmail.com	647-700-8872	2023-08-21	2005-01-18	Server Wages	3194 McCarron Crescent, Mississauga, ON, L5N 3H5	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
1150	Marietta Luz Tason	Marietta Luz Tason	f	2025-12-27 16:45:12.568671-05	2025-12-27 16:45:12.568671-05	0	0	0	0	0	0	\N	\N	(647) 460-9460	2019-10-22	1956-08-27	Server Wages	3102- 80 Absolute Ave., Mississauga, ON, L4Z 0A5	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
18	Nadia Guevara	Nadia Guevara	t	2025-12-23 12:51:54.767785-05	2025-12-23 12:51:54.767785-05	3074.22	0	0	0	3605.4000000000005	0	\N	nadiailianag@hotmail.com	416-834-3086	2001-10-18	1956-05-06	House Keeping Wages..	5721 Turney Drive, Mississauga, ON, L5M 2P7	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3873	Angelisa Delos Reyes	Angelisa Delos Reyes	f	2025-12-31 16:05:05.888759-05	2025-12-31 16:05:05.888759-05	0	0	0	0	-488.56000000000006	0	\N	delosreyesangelisa@gmail.com	(647) 863-9407	2022-08-07	1994-07-21	Night Auditor Wages	425 Rathburn Road East, Unit 78, Mississauga, ON, L4Z 1H6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3881	Bikramjit Singh	Bikramjit Singh	f	2025-12-31 16:05:05.892657-05	2025-12-31 16:05:05.892657-05	0	0	0	0	0	0	\N	\N	2896230113	2023-03-13	2002-09-23	House Keeping Wages	10 Stalbridge Ave, Brampton, ON, L6Y 4H1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3884	Charmaine Clarke	Charmaine Clarke	t	2025-12-31 16:05:05.894268-05	2025-12-31 16:05:05.894268-05	543.21	0	0	0	585.130000000001	0	\N	rockgold81@gmail.com	647-965-0237	1996-07-11	1963-06-09	Laundry Wages	3303 Jone Drive, Mississauga, ON, L5B 1T3	0	501.6	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3883	Chandani KP Meegahage	Chandani KP Meegahage	f	2025-12-31 16:05:05.893808-05	2025-12-31 16:05:05.893808-05	0	0	0	0	348.44	0	\N	\N	647-608-7841	2023-04-17	1966-08-10	House Keeping Wages	95 Charolais Blvd, Apt#1416, Brampton, ON, L6Y 2R9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3885	Chris Alfonso	Chris Alfonso	f	2025-12-31 16:05:05.894898-05	2025-12-31 16:05:05.894898-05	0	0	0	0	0	0	\N	\N	289-623-1053	2023-04-20	1988-10-20	House Keeping Wages	33 Dunfield Avenue, Toronto, ON, M5P 2X8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3871	Analee Santos	Analee Santos	t	2025-12-31 16:05:05.887597-05	2025-12-31 16:05:05.887597-05	1758.17	0	0	0	-225.67999999999938	0	\N	analeew1975santos@gmail.com	(289) 232-0188	2010-04-03	1975-04-03	House Keeping Wages	50 Eglinton Ave W., #1104, Mississauga, ON, L5R 3P5	0	501.6	8	167.2	1	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3886	Christine Pascual	Christine Pascual	f	2025-12-31 16:05:05.895346-05	2025-12-31 16:05:05.895346-05	0	0	0	0	-270.4100000000001	0	\N	christinecpascual77@gmail.com	(647) 862-4855	2022-10-21	1977-01-25	Front Office Manager Salaries	1145 Journeyman Lane, #230, Mississauga, ON, L5J 0B5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3887	Claudia Martinez	Claudia Martinez	f	2025-12-31 16:05:05.89579-05	2025-12-31 16:05:05.89579-05	0	0	0	0	12.56	0	\N	martinezveraclaudiap@gmail.com	647-514-3817	2025-04-05	1970-02-01	House Keeping Wages	7555 Goreway Dr., Mississauga, ON, L4T 3M9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3888	Darshan Kaur	Darshan Kaur	f	2025-12-31 16:05:05.896226-05	2025-12-31 16:05:05.896226-05	0	0	0	0	-193.68000000000006	0	\N	ray.farwha@gmail.com	(437) 982-9683	2022-10-24	1983-07-02	House Keeping Wages	84 Vintage Gate, Brampton, ON, L6X 5C2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
85	Tarminder Kaur Chandi	Tarminder Kaur Chandi	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	0	0	\N	tarminderkaurchandi@gmail.com	647-572-1618	2024-06-04	1988-10-12	House Keeping Wages..	5482 Champlain Trail, Mississauga, ON, L5R 2Z4	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3865	Aditya Gakkhar	Aditya Gakkhar	f	2025-12-31 16:05:05.879826-05	2025-12-31 16:05:05.879826-05	0	0	0	0	0	0	\N	\N	6475070090	2023-03-16	2001-10-22	Front Desk Wages	60 Chadwick Street, Brampton, ON, L6Y 4Y1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3866	Akhtar Nasim	Akhtar Nasim	t	2025-12-31 16:05:05.884326-05	2025-12-31 16:05:05.884326-05	66.01	0	0	0	1381.3199999999997	0	\N	nasimakhtar594@gmail.com	(437) 488-7941	2022-04-08	1971-10-29	Breakfast Wages	908 Apple Croft Circle, Apt#908, Mississauga, ON, L5V 2A7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3867	Akshay Patel	Akshay Patel	t	2025-12-31 16:05:05.885137-05	2025-12-31 16:05:05.885137-05	0	0	0	0	637.9300000000001	0	\N	akshayjpatel123@gmail.com	6478921389	2023-03-25	2000-06-27	House Keeping Wages	27 The Greenway, Cambridge, ON, N1R 6L4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3870	Amparo Jurado	Amparo Jurado	t	2025-12-31 16:05:05.887092-05	2025-12-31 16:05:05.887092-05	0	0	0	0	6024.469999999999	0	\N	amparo.jurado66@hotmail.com	9052723784	1995-03-06	1966-03-06	House Keeping Wages	3568 Cawthra Road, Mississauga, ON, L5A 2Y3	0	0	24	501.6	3	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3868	Aliasger Jaffer	Aliasger Jaffer	f	2025-12-31 16:05:05.885797-05	2025-12-31 16:05:05.885797-05	0	0	0	0	0	0	\N	alijaffer15@gmail.com	(416) 624-5316	2022-05-16	2003-02-15	Front Desk Wages	993 Fredonia Drive, Mississauga, ON, L5C 2W5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
76	Rubina Khan	Rubina Khan	f	2025-12-23 13:22:15.790775-05	2025-12-23 13:22:15.790775-05	0	0	0	0	-2538.459999999999	0	\N	rubykh40@gmail.com	(416) 875-2710	2021-11-19	1957-11-14	Sales & Marketing Salary	6260 Montevideo Road, Apt#24, Mississauga, ON, L5N 4E9	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3879	Bhavesh Patel	Bhavesh Patel	f	2025-12-31 16:05:05.89174-05	2025-12-31 16:05:05.89174-05	0	0	0	0	-812.77	0	\N	9687818889bhavesh@gmail.com	(647) 540-8889	2020-08-21	1987-10-01	Breakfast Wages	15 Nathaniel Cres, Brampton, ON, L6Y 5M2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3874	Anil Vansil	Anil Vansil	t	2025-12-31 16:05:05.889343-05	2025-12-31 16:05:05.889343-05	0	0	0	0	58.370000000000005	0	\N	anilvansil@gmail.com	647-388-4569	2026-01-19	1975-11-22	House Keeping Wages	7501 Catalpa Rd, Malton, ON, L4T 2T4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3877	Apsara Adhikari	Apsara Adhikari	t	2025-12-31 16:05:05.8908-05	2025-12-31 16:05:05.8908-05	0	0	0	0	1049.21	0	\N	aps123.clear@gmail.com	365-987-0061	2025-05-17	1986-04-07	House Keeping Wages	27 Nomad Crescent, Brampton, ON, L6Y 5N5	0	0	16	334.4	2	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3876	Anureet Kaur	Anureet Kaur	f	2025-12-31 16:05:05.890319-05	2025-12-31 16:05:05.890319-05	0	0	0	0	-218.57000000000002	0	\N	\N	(437) 331-3844	2022-08-06	2001-01-12	Laundry Wages	210 Brussels Avenue, Brampton, ON, L62 0B6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3878	Arsdeep Singh	Arsdeep Singh	t	2025-12-31 16:05:05.89128-05	2025-12-31 16:05:05.89128-05	0	0	0	0	2622.1499999999996	0	\N	13arshdeepsinghgill@gmail.com	647-760-0499	2023-02-24	1998-12-12	Front Desk Wages	10 Settler Crt., Brampton, ON, L5R 3P5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3880	Bhuvan Sachdeva	Bhuvan Sachdeva	f	2025-12-31 16:05:05.892201-05	2025-12-31 16:05:05.892201-05	0	0	0	0	0	0	\N	sachdeva.bhuvi@gmail.com	647-877-6194	2023-08-24	1984-01-04	Front Desk Wages	12 Bandera Drive, Brampton, ON, L6Y 5Z3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3875	Anjela Katoch	Anjela Katoch	f	2025-12-31 16:05:05.889837-05	2025-12-31 16:05:05.889837-05	0	0	0	0	0	0	\N	anjelakatoch28@gmail.com	437-345-6585	2023-09-25	1993-09-08	Sales & Marketing Salary	450 Bristol Rd E, Unit 20, Mississauga, ON, L4Z 3Y3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3904	Jaskirat Kaur	Jaskirat Kaur	f	2025-12-31 16:05:05.903734-05	2025-12-31 16:05:05.903734-05	0	0	0	0	-210.12	0	\N	dikshita2125@icloud.com	(236) 888-6500	2022-05-18	1997-03-07	House Keeping Wages	154 Stowmarket St., Caledon, ON, L7C 4C6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3909	Khyati Patel	Khyati Patel	f	2025-12-31 16:05:05.906682-05	2025-12-31 16:05:05.906682-05	0	0	0	0	65.84	0	\N	khyatiptelmehsana2010@gmail.com	226-961-8261	2023-10-16	1999-10-20	Breakfast Wages	15 Nathaniel Cres, Brampton, ON, L6Y 5M2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3910	Komalpreet Kaur	Komalpreet Kaur	t	2025-12-31 16:05:05.907294-05	2025-12-31 16:05:05.907294-05	0	0	0	0	65.13000000000011	0	\N	preetkomal8243@gmail.com	437-984-9377	2023-04-20	2003-03-11	House Keeping Wages	7505 Redstone Rd, Mississauga, ON, L4T 2B7	0	1134.17	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3911	Krishna Kumari Ranabhat	Krishna Kumari Ranabhat	t	2025-12-31 16:05:05.907899-05	2025-12-31 16:05:05.907899-05	0	0	0	0	758.3599999999997	0	\N	weapon.indra81@gmail.com	437-799-1193	2023-08-23	1981-12-03	House Keeping Wages	420 Derrydale Dr., Mississauga, ON, L5W 0E1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3914	Mandaline Pllumaj	Mandaline Pllumaj	t	2025-12-31 16:05:05.909682-05	2025-12-31 16:05:05.909682-05	0	0	0	0	796.3199999999999	0	\N	maddilumaj@gmail.com	\N	2025-01-11	2002-05-16	House Keeping Wages	498 Horner Ave, Etobicoke, ON, M8W 2B8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3916	Marharyta Stashevska	Marharyta Stashevska	f	2025-12-31 16:05:05.910903-05	2025-12-31 16:05:05.910903-05	0	0	0	0	0	0	\N	\N	416-732-2546	2023-03-28	2004-03-09	House Keeping Wages	4306 Beacon Ln, Mississauga, ON, L5C 3V9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3917	Marjorie Francis Sy	Marjorie Francis Sy	t	2025-12-31 16:05:05.911575-05	2025-12-31 16:05:05.911575-05	0	0	0	0	544.16	0	\N	marjoriefrances.sy@gmail.com	647-867-5036	2025-06-28	1996-01-27	Front Desk Wages	2350 Dundas St West, Toronto, ON, M6P 4B1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3918	Mary Grace Barro	Mary Grace Barro	f	2025-12-31 16:05:05.912319-05	2025-12-31 16:05:05.912319-05	0	0	0	0	0	0	\N	mgracesbarro@gmail.com	437-973-1895	2023-07-12	1991-05-18	Front Desk Wages	169 Regent Road, North York, ON, M3K 1H6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3920	Meenu Meenu	Meenu Meenu	f	2025-12-31 16:05:05.914053-05	2025-12-31 16:05:05.914053-05	0	0	0	0	0	0	\N	mannasharma588@gmail.com	437-980-1980	2024-06-22	1997-11-13	House Keeping Wages	36 Courtsfields Cres, Brampton, ON, L7A 2E2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3890	Elise Valeria Ryba Vinasco	Elise Valeria Ryba Vinasco	f	2025-12-31 16:05:05.897117-05	2025-12-31 16:05:05.897117-05	0	0	0	0	0	0	\N	valeriaryba1705@hotmail.com	647-379-2050	2023-07-08	2001-05-17	House Keeping Wages	2247 Hurontario Street, Mississauga, ON, L5A 2G2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3891	Elsaida Zenelaj	Elsaida Zenelaj	f	2025-12-31 16:05:05.897553-05	2025-12-31 16:05:05.897553-05	0	0	0	0	0	0	\N	elsaidaidrizi98@gmail.com	437-604-9662	2024-07-22	1999-03-22	House Keeping Wages	329 The West Mall, Apt#108, Etobicoke, ON, M9C 1E1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3892	Filemona Kroni	Filemona Kroni	t	2025-12-31 16:05:05.897991-05	2025-12-31 16:05:05.897991-05	0	0	0	0	67.69999999999993	0	\N	filemonaducaj@gmail.com	647-643-2141	2025-02-02	1999-02-04	House Keeping Wages	8 Cheshire drive, Etobicoke, ON, M9B 2N8	0	520.41	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3894	Florina Gjokaj	Florina Gjokaj	t	2025-12-31 16:05:05.898894-05	2025-12-31 16:05:05.898894-05	1722.23	0	0	0	-463.22000000000025	0	\N	florina.97@icloud.com	(647) 571-7842	2018-11-22	1971-01-25	House Keeping Wages	5411 Randolph Crescent, Burlington, ON, L7L 3C4	0	1374.52	16	334.4	2	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3895	Gagandeep Kaur Brar	Gagandeep Kaur Brar	f	2025-12-31 16:05:05.899329-05	2025-12-31 16:05:05.899329-05	0	0	0	0	-39.370000000000005	0	\N	\N	(514) 576-3052 Jagroo	2022-12-15	1997-03-15	House Keeping Wages	210 Brussels Avenue, Brampton, ON, L6ZOY1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3896	Gautam Saini	Gautam Saini	f	2025-12-31 16:05:05.899769-05	2025-12-31 16:05:05.899769-05	0	0	0	0	0	0	\N	mail.gautam4444@gmail.com	647-450-8301	2024-06-10	2002-05-17	Front Desk Wages	20 Mount Fuji Crescent, Brampton, ON, L6R 2L3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3898	Gurneet Kaur	Gurneet Kaur	f	2025-12-31 16:05:05.900651-05	2025-12-31 16:05:05.900651-05	0	0	0	0	0	0	\N	gurneet9810dhillon@gmail.com	647-864-8591	2024-05-22	1998-11-10	Front Desk Wages	10 Merlin Drive, Brampton, ON, L6P 1E9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3899	Gursimran Kaur	Gursimran Kaur	t	2025-12-31 16:05:05.901089-05	2025-12-31 16:05:05.901089-05	0	0	0	0	519.14	0	\N	gursimrankaurca08@gmail.com	647-273-7193	2025-07-02	2005-08-30	Breakfast Wages	3027 Lafontaine Road, Mississauga, ON, L4T 1Z4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3900	Harshit Sharma	Harshit Sharma	f	2025-12-31 16:05:05.901564-05	2025-12-31 16:05:05.901564-05	0	0	0	0	0	0	\N	harshitseneca@gmail.com	416-876-7644	2023-11-27	2001-02-08	Front Desk Wages	21 Navaho Drive, North York, ON, M2H 2X2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3901	Inderjeet Singh Khurmi	Inderjeet Singh Khurmi	t	2025-12-31 16:05:05.902003-05	2025-12-31 16:05:05.902003-05	0	0	0	0	1059.69	0	\N	inderbb2001@gmail.com	905-866-4906	2024-12-16	2001-03-11	House Person Wages	36 Dalraith Cres, Brampton, ON, L6T 2X5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3903	Jagroop Dhillon	Jagroop Dhillon	f	2025-12-31 16:05:05.903115-05	2025-12-31 16:05:05.903115-05	0	0	0	0	-621.1600000000001	0	\N	\N	(647) 527-0078	2022-04-02	2002-02-13	House Keeping Wages	15 Sedgegrass Way, Brampton, ON, L6R 3C9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3908	Kartik Kartik	Kartik Kartik	t	2025-12-31 16:05:05.906077-05	2025-12-31 16:05:05.906077-05	0	0	0	0	479.88	0	\N	kartikbhandari310@gmail.com	437-679-0799	2024-05-29	1998-11-24	Front Desk Wages	100 Orchid Drive, Brampton, ON, L7A 2C8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3905	Jasvir Sidhu	Jasvir Sidhu	t	2025-12-31 16:05:05.904373-05	2025-12-31 16:05:05.904373-05	0	0	0	0	929.56	0	\N	jasveerkaur36181@gmail.com	647-638-6591	2023-09-05	1998-12-19	House Keeping Wages	15 Goodview Drive, Brampton, ON, L6R 0B6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3906	Jose Isidro Saenz Chacon	Jose Isidro Saenz Chacon	t	2025-12-31 16:05:05.904888-05	2025-12-31 16:05:05.904888-05	0	0	0	0	2836.4800000000005	0	\N	jisch77@gmail.com	647-769-0070	2023-03-30	1977-01-12	House Keeping Wages	3590 Kaneff Crescent, Apt#1504, Mississauga, ON, L5A 3K3	0	0	16	334.4	2	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3907	Kalp Upadhyay	Kalp Upadhyay	f	2025-12-31 16:05:05.905366-05	2025-12-31 16:05:05.905366-05	0	0	0	0	0	0	\N	kalp19062004@gmail.com	905-783-9718	2023-05-20	2004-06-19	Breakfast Wages	27 Ashdale Rd, Brampton, ON, L6Y 5M7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3936	Prabhjot Kaur	Prabhjot Kaur	t	2025-12-31 16:05:05.923112-05	2025-12-31 16:05:05.923112-05	0	0	0	0	974.36	0	\N	rehal0225@gmail.com	437-661-8902	2025-01-25	2000-02-25	House Keeping Wages	114 Cherrytree Drive, Brampton, ON, L6Y 3N9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3937	Prabhjot, Prabhjot	Prabhjot, Prabhjot	f	2025-12-31 16:05:05.9236-05	2025-12-31 16:05:05.9236-05	0	0	0	0	-173.17	0	\N	\N	(905) 347-5858	2022-11-08	2002-02-04	House Keeping Wages	58 Bach Blvd, Brampton, ON, L6Y 2X5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3941	Premadasa Kumarawadu	Premadasa Kumarawadu	t	2025-12-31 16:05:05.925513-05	2025-12-31 16:05:05.925513-05	3970.95	0	0	0	-1076.1500000000005	0	\N	premadasakumarawadu@gmail.com	(647) 531-3834	2012-04-14	1954-07-19	House Person Wages	124 Jade Cresent, Brampton, ON, L6S 3M8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3942	Premawathy Sritharan	Premawathy Sritharan	t	2025-12-31 16:05:05.925969-05	2025-12-31 16:05:05.925969-05	678.46	0	0	0	3016.08	0	\N	prema.sri@outlook.com	(647) 974-4655	2017-08-09	1965-12-21	House Keeping Wages	150 Upper Canada Court, Georgetown, ON, L7G 0L4	0	501.6	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3943	Prudence Christie	Prudence Christie	t	2025-12-31 16:05:05.926424-05	2025-12-31 16:05:05.926424-05	86.92	0	0	0	-54.48000000000002	0	\N	prudencechristie0@gmail.com	647-704-2163	2018-09-01	1961-05-16	Laundry Wages	90 Marycroft Court, Brampton, ON, L7A 2G2	0	134.11	24	501.6	3	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3963	Valda Miller	Valda Miller	f	2025-12-31 16:05:05.936087-05	2025-12-31 16:05:05.936087-05	0	0	0	0	0	0	\N	\N	(647) 624-2086	2013-06-27	1954-11-13	House Keeping Wages	27 Durango Drive, Brampton, ON, L6X 5H2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3921	Meissa Sokalski	Meissa Sokalski	t	2025-12-31 16:05:05.915152-05	2025-12-31 16:05:05.915152-05	1177.52	0	0	0	4226.98	0	\N	meissa.sokalski@yahoo.ca	(905) 803-8699	2017-06-10	1969-11-15	House Keeping Wages	885 Thistle Down Cir, Mississauga, ON, L5C 3K5	0	0	8	167.2	1	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3926	Namnish Kaur	Namnish Kaur	t	2025-12-31 16:05:05.918469-05	2025-12-31 16:05:05.918469-05	0	0	0	0	2429.42	0	\N	12namnishkaur@gmail.com	437-858-9933	2024-01-22	1998-08-30	Front Desk Wages	10 Settler Court, Brampton, ON, L6Z 4L8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3912	Luis Jurado	Luis Jurado	t	2025-12-31 16:05:05.908563-05	2025-12-31 16:05:05.908563-05	5350.62	0	0	0	-74.67000000000007	0	\N	amparo.jurado66@hotmail.com	905-272-3784	1990-06-26	1961-11-10	House Person Wages	3568 Cawthra Road, Mississauga, ON, L5A 2Y3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3923	Mohamed Jaffer	Mohamed Jaffer	t	2025-12-31 16:05:05.916583-05	2025-12-31 16:05:05.916583-05	0	0	0	0	0	0	\N	mohamedj9972@gmail.com	6472975945	1993-01-01	1972-04-08	Management Salaries	993 Fredonia Drive, Mississauga, ON, L5C 2W4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3922	Mittal Patel	Mittal Patel	f	2025-12-31 16:05:05.915901-05	2025-12-31 16:05:05.915901-05	0	0	0	0	-561.23	0	\N	\N	(647) 667-7700	2019-04-18	1989-02-20	Sales & Marketing Salary	15 Nathaniel Cres., Brampton, ON, L6Y 5M2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3925	Naman Jain	Naman Jain	t	2025-12-31 16:05:05.917845-05	2025-12-31 16:05:05.917845-05	2086.64	0	0	0	-1321.8100000000013	0	\N	naman919@gmail.com	(416) 826-6177	2019-04-24	1980-12-07	General Manager Salary	36 Meadowlark Drive, Brampton, ON, L6Y 4A7	0	1346.16	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3924	Muskan Sekhon	Muskan Sekhon	f	2025-12-31 16:05:05.917226-05	2025-12-31 16:05:05.917226-05	0	0	0	0	-479.30000000000007	0	\N	\N	(437) 218-2913 Ext.	2022-04-02	2000-07-24	House Keeping Wages	15 Sedgegrass Way, Brampton, ON, L6R 3C9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3927	Navjot Singh	Navjot Singh	f	2025-12-31 16:05:05.919108-05	2025-12-31 16:05:05.919108-05	0	0	0	0	0	0	\N	navjotsingh5565n@gmail.com	647-894-8243	2023-02-20	2001-02-18	House Person Wages	10 Stalbridge Ave, Brampton, ON, L6Y 4H1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3929	Neha Verma	Neha Verma	f	2025-12-31 16:05:05.920069-05	2025-12-31 16:05:05.920069-05	0	0	0	0	-159.10000000000036	0	\N	nehav9533@gmail.com	(705) 288-8229	2022-04-11	2000-02-29	Front Office Manager Salaries	5 Lombardy Crescent, Brampton, ON, L6S 4L7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3931	Novlette Edwards	Novlette Edwards	t	2025-12-31 16:05:05.921002-05	2025-12-31 16:05:05.921002-05	647.37	0	0	0	-147.38999999999942	0	\N	edwardsnans@yahoo.com	416-509-9134	2017-07-12	1961-05-29	Laundry Wages	93 Convoy Cres, Maple, ON, L6A 3H3	0	836	24	501.6	3	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3932	Parmveer Singh	Parmveer Singh	t	2025-12-31 16:05:05.921465-05	2025-12-31 16:05:05.921465-05	0	0	0	0	1986.8100000000002	0	\N	parmveersingh2408@gmail.com	647-248-7544	2024-01-23	2003-08-24	House Person Wages	39 Portstewart Crescent, Brampton, ON, L6X 0R6	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3928	Neel Ashishbhai Patel	Neel Ashishbhai Patel	f	2025-12-31 16:05:05.919613-05	2025-12-31 16:05:05.919613-05	0	0	0	0	-466.16	0	\N	\N	(647) 781-4842	2022-05-18	2003-04-20	Breakfast Wages	37 Altura Way, Brampton, ON, L6P 0W4	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3933	Parneet Kaur	Parneet Kaur	f	2025-12-31 16:05:05.921883-05	2025-12-31 16:05:05.921883-05	0	0	0	0	0	0	\N	parneetkaur57614@gmail.com	437-983-3662	2023-10-11	2001-11-12	House Keeping Wages	4792 James Austin Drive, Mississauga, ON, L4Z 4H3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3934	Payal Arora	Payal Arora	f	2025-12-31 16:05:05.922293-05	2025-12-31 16:05:05.922293-05	0	0	0	0	0	0	\N	\N	647-870-4293	2023-04-30	1998-07-02	Front Desk Wages	510 Curran Place, Apt#1806, Mississauga, ON, L5B 0J8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3935	Payal Patel	Payal Patel	f	2025-12-31 16:05:05.922712-05	2025-12-31 16:05:05.922712-05	0	0	0	0	-1281.86	0	\N	7698882499payal@gmail.com	(647) 684-2499	2022-03-21	1988-09-13	Laundry Wages	15 Nathaniel Cres, Brampton, ON, L6Y 5M2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3938	Prathamraj Bihola	Prathamraj Bihola	f	2025-12-31 16:05:05.924101-05	2025-12-31 16:05:05.924101-05	0	0	0	0	0	0	\N	\N	647-622-5541	2023-07-27	2001-09-18	House Keeping Wages	9 Lent Crescent, Brampton, ON, L6Y 5E5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3939	Pravallika Gude	Pravallika Gude	f	2025-12-31 16:05:05.924581-05	2025-12-31 16:05:05.924581-05	0	0	0	0	0	0	\N	gudepravallika5566@gmail.com	647-832-3335	2025-11-24	1998-12-11	Front Desk Wages	245 Charlotte St, Peterborough, ON, K9J 7K6	0	260.8	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3959	Tanisha Sharma	Tanisha Sharma	t	2025-12-31 16:05:05.934185-05	2025-12-31 16:05:05.934185-05	0	0	0	0	655.11	0	\N	khajuriatanisha142@gmail.com	365-866-1847	2025-05-13	2003-06-19	House Keeping Wages	79 Baffin Crescent, Brampton, ON, L7A 0L7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3962	Vaishnavi Gosbal	Vaishnavi Gosbal	f	2025-12-31 16:05:05.935637-05	2025-12-31 16:05:05.935637-05	0	0	0	0	0	0	\N	\N	437-688-1858	2023-02-13	1999-06-26	Breakfast Wages	2 Silver Maple Court, Brampton, ON, L6T 4R1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3950	Sikta Sammi	Sikta Sammi	t	2025-12-31 16:05:05.929876-05	2025-12-31 16:05:05.929876-05	0	0	0	0	25.87	0	\N	sammisikta3@gmail.com	437-313-3312	2026-02-07	2004-04-02	Server Wages	63 Fallingdale Cres, Brampton, ON, L6T 3J5	0	0	0	0	0	0	0	0	0	Holiday Inn & Suites -2565 Argentia
3940	Preetaman Singh Pahuja	Preetaman Singh Pahuja	t	2025-12-31 16:05:05.925054-05	2025-12-31 16:05:05.925054-05	0	0	0	0	3458.3900000000003	0	\N	preetamansinghpahuja@gmail.com	647-674-9510	2023-11-10	1991-03-15	Front Office Supervisor Wages	7731 Redstone Rd, Mississauga, ON, L4T 2C1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3960	Tatiana Bravo	Tatiana Bravo	t	2025-12-31 16:05:05.934631-05	2025-12-31 16:05:05.934631-05	904.26	0	0	0	-852.1199999999999	0	\N	tatianaxxbravo@hotmail.com	(647) 575-5232	2022-04-11	1993-02-04	House Keeping Wages	3121 Kirwin Ave, Apt 503, Mississauga, ON, L5A 3K9	0	400.24	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3944	Reet-Inder Bains	Reet-Inder Bains	f	2025-12-31 16:05:05.926878-05	2025-12-31 16:05:05.926878-05	0	0	0	0	0	0	\N	inder.bains@outlook.com	647-537-7755	2023-05-29	1988-05-17	Night Auditor Wages	592 Huntington Ridge Drive, Mississauga, ON, L5R 1Z7	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3946	Ruja Maharjan	Ruja Maharjan	t	2025-12-31 16:05:05.927834-05	2025-12-31 16:05:05.927834-05	0	0	0	0	3588.3500000000004	0	\N	rujamaharjan9@gmail.com	514-574-0612	2023-04-30	1995-06-12	Front Desk Wages	5267 Atwell Ave, Mississauga, ON, L5R 3K1	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3949	Sikiru Gaji	Sikiru Gaji	f	2025-12-31 16:05:05.929417-05	2025-12-31 16:05:05.929417-05	0	0	0	0	-247.1500000000001	0	\N	sikigaji1@gmail.com	438-925-2504	2020-07-26	1953-07-22	House Person Wages	27 Kalahari Road, Brampton, ON, L6R 2R2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3947	Sagarika Sharma	Sagarika Sharma	f	2025-12-31 16:05:05.928291-05	2025-12-31 16:05:05.928291-05	0	0	0	0	-449.59000000000003	0	\N	\N	(647) 613-2472	2022-09-06	1996-01-28	Front Desk Wages	77 Whitwell Drive, Brampton, ON, L6P 1E5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3948	Satvik Abrol	Satvik Abrol	f	2025-12-31 16:05:05.928963-05	2025-12-31 16:05:05.928963-05	0	0	0	0	0	0	\N	abrolsatvik@gmail.com	437-559-0340	2023-07-02	1998-04-14	Front Desk Wages	120 Clansman Trail, Mississauga, ON, L4Z 3H2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3915	Manpreet Kaur	Manpreet Kaur	f	2025-12-31 16:05:05.910161-05	2025-12-31 16:05:05.910161-05	35.97	0	0	0	3.9700000000000273	0	\N	sran9584@gmail.com	(437) 219-7227 Ext.	2023-01-14	1995-08-23	House Keeping Wages	52 Donald Stewart Rd, Brampton, ON, L7A 0C3	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3952	Simran Sidhu	Simran Sidhu	f	2025-12-31 16:05:05.930775-05	2025-12-31 16:05:05.930775-05	0	0	0	0	0	0	\N	simransidhu2212000@gmail.com	6473918354	2023-01-07	2001-01-22	Breakfast Wages	119 Sunforest Drive, Brampton, ON, L6Z 3Z8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3953	Sonia Sonia	Sonia Sonia	f	2025-12-31 16:05:05.931221-05	2025-12-31 16:05:05.931221-05	0	0	0	0	62.4	0	\N	\N	647-471-0241	2023-04-03	1991-01-18	House Keeping Wages	3436 Chipley Crescent, Mississauga, ON, L4T 2E2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3955	Sukhjeet Kaur	Sukhjeet Kaur	t	2025-12-31 16:05:05.932359-05	2025-12-31 16:05:05.932359-05	0	0	0	0	1192.34	0	\N	sukhjeetkaur9971@gmail.com	647-505-8544	2024-10-17	1992-05-10	Breakfast Wages	22 Drayglass Court, Brampton, ON, L6Z 4E9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3956	Sukhjit Kumar	Sukhjit Kumar	f	2025-12-31 16:05:05.932826-05	2025-12-31 16:05:05.932826-05	0	0	0	0	-468.99	0	\N	kumarsukhjit1999@gmail.com	(365) 880-4473	2022-08-02	1999-06-08	Front Desk Wages	163 Giltspur Drive, North York, ON, M3L 1N2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3957	Sumandeep Kaur	Sumandeep Kaur	f	2025-12-31 16:05:05.933277-05	2025-12-31 16:05:05.933277-05	0	0	0	0	0	0	\N	sumanmand7@gmail.com	647-627-0876	2023-07-26	2003-09-22	Breakfast Wages	20 Brownridge Court, Brampton, ON, L6W 4L5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3961	Vaibhav Sharma	Vaibhav Sharma	f	2025-12-31 16:05:05.935158-05	2025-12-31 16:05:05.935158-05	0	0	0	0	-38.370000000000005	0	\N	\N	(437) 922-1773 Ext.	2022-12-17	1999-01-28	Front Desk Wages	2 Saint Topez Ct, Brampton, ON, L6Y 4P9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3945	Remo Roy	Remo Roy	f	2025-12-31 16:05:05.927375-05	2025-12-31 16:05:05.927375-05	0	0	0	0	84.54	0	\N	remoponnamattam1@gmail.com	647-641-4311	2025-01-27	1999-04-08	Front Desk Wages	614 Sumbber Park Crescent, Mississauga, ON, L5B 4E9	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3958	Sunayna Sharma	Sunayna Sharma	f	2025-12-31 16:05:05.933728-05	2025-12-31 16:05:05.933728-05	0	0	0	0	0	0	\N	sunaynamusic31@gmail.com	\N	2024-07-15	1999-07-31	Front Desk Wages	42 Briarlynn Road, Winnipeg, ON, R3T 6A2	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3964	Vicente Lopez Toledo	Vicente Lopez Toledo	t	2025-12-31 16:05:05.93655-05	2025-12-31 16:05:05.93655-05	0	0	0	0	3596.21	0	\N	vlopeztoledo82@gmail.com	437-299-4951	2024-05-11	1982-03-12	Maintenance Technician Wages	12337 Kennedy Road, Caledon, ON, L7C 3M8	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
3951	Simran Kaur Brar	Simran Kaur Brar	f	2025-12-31 16:05:05.93033-05	2025-12-31 16:05:05.93033-05	0	0	0	0	0	0	\N	\N	437-983-6612	2023-08-17	1998-10-22	House Keeping Wages	18 Knightbridge Rd., Brampton, ON, L6T 3X5	0	0	0	0	0	0	0	0	0	Holiday Inn Express & Suites - 5599 Ambler
\.


--
-- Data for Name: import_rows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_rows (id, import_id, row_number, employee_key, status, message, raw_json, created_at) FROM stdin;
\.


--
-- Data for Name: imports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imports (id, imported_by, source_filename, source_type, as_of_date, vacation_col, sick_col, rows_total, rows_ok, rows_skipped, created_at, report_kind, source_csv, stored_filename, hotel, sick_amount_col, year) FROM stdin;
\.


--
-- Data for Name: manual_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manual_entries (id, hotel, employee, year, type, hours, note, created_at, from_date, to_date, days, allocated_year) FROM stdin;
2	Holiday Inn Express & Suites - 5599 Ambler	Jaffer Fayazali	2026	Vacation	\N	\N	2026-01-03 12:18:11.676225-05	2026-01-19	2026-01-23	5	\N
3	Holiday Inn Express & Suites - 5599 Ambler	Jaffer Fayazali	2026	Vacation	\N	\N	2026-01-04 09:34:41.452573-05	2025-12-08	2025-12-19	10	\N
4	Holiday Inn Express & Suites - 5599 Ambler	Filomena Kinsley	2026	Birthday	\N	\N	2026-01-06 10:47:36.319311-05	2026-01-02	2026-01-02	1	\N
5	Holiday Inn Express & Suites - 5599 Ambler	Naman Jain	2026	Vacation	\N	\N	2026-01-06 11:01:13.049381-05	2026-01-02	2026-01-02	1	\N
6	Holiday Inn & Suites -2565 Argentia	Paramjit Kaur	2026	Sick	\N	Personal Day	2026-01-19 14:18:55.457082-05	2026-01-03	2026-01-03	1	\N
7	Holiday Inn & Suites -2565 Argentia	Chris-Solo Capuy	2026	Sick	\N	sick	2026-01-19 14:43:42.287128-05	2026-01-14	2026-01-14	1	\N
39	Holiday Inn & Suites -2565 Argentia	Courtney Nicholas	2026	Sick	\N	sick day	2026-02-17 08:44:23.676399-05	2026-01-25	2026-01-25	1	\N
40	Holiday Inn & Suites -2565 Argentia	Cindy Bryce	2026	Vacation	\N	vac 2 days but only 14.57 hrs avail $256.45	2026-02-17 08:47:48.494802-05	2026-01-27	2026-01-28	1.82125	\N
41	Holiday Inn Express & Suites - 5599 Ambler	Naman Jain	2026	Vacation	\N	off sick. taken only 2.5 vac days	2026-02-17 08:49:26.458715-05	2026-02-02	2026-02-04	2.5	\N
42	Holiday Inn Express & Suites - 5599 Ambler	Florina Gjokaj	2026	Birthday	\N	\N	2026-02-17 08:53:28.30738-05	2026-01-25	2026-01-25	1	\N
8	Holiday Inn Express & Suites - 5599 Ambler	Prudence Christie	2026	Sick	\N	was in payroll 1 of 2026 but is allocated for 2025	2026-01-25 13:35:42.573093-05	2025-12-27	2025-12-28	2	2025
17	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Sick	\N	sick for 2025	2026-01-25 16:17:15.676484-05	2025-12-22	2025-12-23	2	2025
18	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Sick	\N	sick for 2025	2026-01-25 16:17:46.242176-05	2025-12-28	2025-12-28	1	2025
19	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Vacation	\N	\N	2026-01-25 16:18:26.607444-05	2026-01-06	2026-01-06	1	\N
20	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Vacation	\N	\N	2026-01-25 16:18:33.770253-05	2026-01-07	2026-01-08	2	\N
21	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Vacation	\N	\N	2026-01-25 16:19:00.602675-05	2026-01-12	2026-01-12	1	\N
22	Holiday Inn Express & Suites - 5599 Ambler	Novlette Edwards	2026	Vacation	\N	\N	2026-01-25 16:19:07.47883-05	2026-01-14	2026-01-14	1	\N
23	Holiday Inn Express & Suites - 5599 Ambler	Niyati Patel	2026	Vacation	\N	\N	2026-01-25 16:20:11.459752-05	2026-01-14	2026-01-14	1	\N
24	Holiday Inn Express & Suites - 5599 Ambler	Jose Isidro Saenz Chacon	2026	Sick	\N	sick for 2025	2026-01-25 16:23:56.883808-05	2025-12-20	2025-12-21	2	2025
25	Holiday Inn Express & Suites - 5599 Ambler	Jose Isidro Saenz Chacon	2026	Birthday	\N	actual bday Jan12. took it on Jan16	2026-01-25 16:24:36.972297-05	2026-01-16	2026-01-16	1	\N
26	Holiday Inn Express & Suites - 5599 Ambler	Analee Santos	2026	Vacation	\N	\N	2026-01-25 16:27:20.849915-05	2026-01-05	2026-01-05	1	\N
27	Holiday Inn Express & Suites - 5599 Ambler	Analee Santos	2026	Vacation	\N	\N	2026-01-25 16:27:30.323506-05	2026-01-16	2026-01-16	1	\N
28	Holiday Inn Express & Suites - 5599 Ambler	Amparo Jurado	2026	Sick	\N	sick for 2025. not used and than actually worked	2026-01-25 16:29:49.24965-05	2025-12-29	2025-12-31	3	2025
43	Holiday Inn Express & Suites - 5599 Ambler	Florina Gjokaj	2026	Sick	\N	personal day	2026-02-17 08:54:08.890405-05	2026-01-19	2026-01-19	1	\N
29	Holiday Inn Express & Suites - 5599 Ambler	Ambika Thapa	2026	Sick	\N	personal. apply against 2025	2026-01-26 08:22:32.860256-05	2025-12-23	2025-12-23	1	2025
30	Holiday Inn Express & Suites - 5599 Ambler	Analee Santos	2026	Sick	\N	in payroll 1. for 2025	2026-01-26 08:25:54.58954-05	2025-12-22	2025-12-22	1	2025
31	Holiday Inn Express & Suites - 5599 Ambler	Apsara Adhikari	2026	Sick	\N	personal days for 2025	2026-01-26 08:27:34.978537-05	2025-12-23	2025-12-24	2	2025
32	Holiday Inn Express & Suites - 5599 Ambler	Charmaine Clarke	2026	Vacation	\N	\N	2026-01-26 08:28:45.570238-05	2025-12-30	2025-12-30	1	\N
33	Holiday Inn Express & Suites - 5599 Ambler	Filemona Kroni	2026	Vacation	\N	dec30/31 only 1.529hrs $218.80 avail	2026-01-26 08:31:19.704422-05	2025-12-27	2025-12-28	1.529	2025
34	Holiday Inn Express & Suites - 5599 Ambler	Filomena Kinsley	2026	Vacation	\N	not enough funds available. entered as 0  days for 2025	2026-01-26 08:34:43.68788-05	2025-12-27	2025-12-28	0	2025
35	Holiday Inn Express & Suites - 5599 Ambler	Krishna Kumari Ranabhat	2026	Birthday	\N	bday for 2025. paid on 2026 payroll#. she was on vacation and was not noted	2026-01-26 08:37:13.212697-05	2025-12-22	2025-12-22	1	2025
36	Holiday Inn Express & Suites - 5599 Ambler	Premawathy Sritharan	2026	Birthday	\N	2025 bday. paid on 2026 payroll#1	2026-01-26 08:39:36.824566-05	2025-12-21	2025-12-21	1	2025
37	Holiday Inn Express & Suites - 5599 Ambler	Tatiana Bravo	2026	Vacation	\N	vac dec22/23/24/29/30/31. dont have payroll notes. balance low. paid on payroll#1 2026	2026-01-26 08:42:55.983212-05	\N	\N	\N	2025
38	Holiday Inn & Suites -2565 Argentia	Milanda Gad	2026	Vacation	\N	was off jan24/26 to jan30/26. kids operation. only $312.47 available to pay approx.16.445 hrs	2026-02-17 08:43:17.756974-05	2026-01-24	2026-02-18	2.055625	\N
44	Holiday Inn Express & Suites - 5599 Ambler	Florina Gjokaj	2026	Sick	\N	personal day	2026-02-17 08:54:36.118872-05	2026-01-30	2026-01-30	1	\N
45	Holiday Inn Express & Suites - 5599 Ambler	Charmaine Clarke	2026	Vacation	\N	\N	2026-02-17 08:55:27.437761-05	2026-01-26	2026-01-26	1	\N
46	Holiday Inn Express & Suites - 5599 Ambler	Analee Santos	2026	Sick	\N	personal day	2026-02-17 08:56:07.913501-05	2026-01-19	2026-01-19	1	\N
47	Holiday Inn Express & Suites - 5599 Ambler	Ambika Thapa	2026	Sick	\N	personal day	2026-02-22 11:01:01.663415-05	2026-02-03	2026-02-03	1	\N
48	Holiday Inn Express & Suites - 5599 Ambler	Prudence Christie	2026	Sick	\N	personal day	2026-02-22 11:04:03.318322-05	2026-01-10	2026-01-10	1	\N
49	Holiday Inn Express & Suites - 5599 Ambler	Charmaine Clarke	2026	Vacation	\N	\N	2026-02-22 11:07:14.397499-05	2026-02-02	2026-02-02	1	\N
50	Holiday Inn Express & Suites - 5599 Ambler	Meissa Sokalski	2026	Sick	\N	\N	2026-02-22 11:08:43.296065-05	2026-02-09	2026-02-09	1	\N
51	Holiday Inn & Suites -2565 Argentia	Chris-Solo Capuy	2026	Sick	\N	\N	2026-02-22 11:20:53.186921-05	2026-02-05	2026-02-05	1	\N
\.


--
-- Data for Name: pto_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pto_balances (id, employee_id, import_id, as_of_date, vacation_hours, sick_hours, created_at, sick_amount, bereavement_hours, bereavement_amount, vacation_amount, vacation_used_hours, vacation_used_amount, sick_used_hours, sick_used_amount, sick_days_used, bereavement_used_hours, bereavement_used_amount, bereavement_days_used) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (token, user_id, expires_at, created_at, ip_address, user_agent) FROM stdin;
28f15d2501fa57bc23790942bc975a29cf4fbbf353842df5bc0e45fdb8c35cbb	1	2025-12-31 19:18:25.539-05	2025-12-30 19:18:25.539963-05	\N	\N
326b46fa6a5fb8293d9ee57b0e96cec731bd7928e11a279657aa064835646349	1	2025-12-31 19:20:46.722-05	2025-12-30 19:20:46.723723-05	\N	\N
448baa0d3e56cf7a8a37d1c9e4f46195c5a1f33dd3ed85cbd45f7dd2bca4bfca	1	2026-01-02 09:41:12.541-05	2026-01-01 09:41:12.542431-05	\N	\N
bbbc2993770767d425d8f0fd6e1f711dc7387282b4836fccc7658b5af80e48cc	1	2026-01-04 11:58:34.854-05	2026-01-03 11:58:34.855302-05	\N	\N
d17e363cb1e1c483a27f9d5c2d3aecffefce53b412892462c016c8b531c8566d	1	2026-01-07 15:17:20.39-05	2026-01-06 15:17:20.391029-05	\N	\N
ac2ccd9e60e7afe0672ad3c2b84310d1bc5c3004e3ab9fe1a05742b8cda91f4b	1	2026-01-10 09:12:24.996-05	2026-01-09 09:12:25.007293-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
54b08828db92f843e69c3329c09c8a0db362824323c6b043eb1f5757db5c395f	1	2026-01-10 09:12:30.642-05	2026-01-09 09:12:30.652756-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
27395d4e4e863a35d1d95b79fba96d71a85413a1460c73606ae4134aaa98fa6d	1	2026-01-15 13:54:56.246-05	2026-01-14 13:54:56.248213-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
45506e002af2a164efff3e3defe7b821f90616610376560d056a13ea0f301478	1	2026-01-17 07:50:09.687-05	2026-01-16 07:50:09.688187-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
dbf7efc83b6135cc72156a90f84364a2a1bd8195cbfe9c4ae9d65ff4dc2b95ce	1	2026-01-20 14:08:34.289-05	2026-01-19 14:08:34.290379-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
65e754e3abf3ed601df8a8da33d19d0e6298c2ed13ecc8ac9c6413dbda0981a0	1	2026-01-26 13:30:19.208-05	2026-01-25 13:30:19.20946-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
df8250936a870e17b40129ac072f20da0edad223c76b18da0cfee2152a13b9fe	1	2026-01-26 13:38:34.235-05	2026-01-25 13:38:34.238084-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
5f6e2456f7edbab2f5e32e95538890a6922dcc1493e2a2dec440427b48a5f875	1	2026-01-28 08:43:39.621-05	2026-01-27 08:43:39.629008-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
2ae847b105ae1b8812cc5c42a7fcf2b84e26b889d792ffd922c3becbd3d16bb2	1	2026-02-18 08:38:59.318-05	2026-02-17 08:38:59.332926-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
e276d99f6490c41be235a709dd53661e1d12797aa62d0735d377c16cf5462458	1	2026-02-19 08:39:35.359-05	2026-02-18 08:39:35.36523-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
639e19c80562420cf8cdbf5280a340a3eee1ed8d455c38338d18934fa53cdf82	1	2026-02-23 10:21:40.863-05	2026-02-22 10:21:40.864846-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
82fec2cd9bc142c75face24e7d3785c1e177216a8ccc645b1f56ae322de7ec81	1	2026-03-04 09:07:47.827-05	2026-03-03 09:07:47.82848-05	10.0.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
4170a94a711ade67c95c7b8a58362774c0352017e2323f2e45e65887c183ed04	1	2026-03-04 09:56:45.306-05	2026-03-03 09:56:45.307649-05	10.0.0.183	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
a0bc27b5da26b961626f25659eb372d367455a166613c3c518a4b530ec7a44e4	1	2026-03-04 11:03:06.157-05	2026-03-03 11:03:06.159576-05	192.168.0.183	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
5310205fd325e5fc98f2b7f0d5f069e6c5eedcb76508f98f8a2900bf07b43123	1	2026-03-04 11:35:02.559-05	2026-03-03 11:35:02.559989-05	192.168.0.134	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
\.


--
-- Data for Name: settings_hotels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings_hotels (id, name) FROM stdin;
1	Holiday Inn & Suites -2565 Argentia
2	Holiday Inn Express & Suites - 5599 Ambler
\.


--
-- Data for Name: settings_ip_allowlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings_ip_allowlist (id, ip_address, description, created_at) FROM stdin;
1	10.0.0.134	Fayaz Desk	2026-01-07 08:40:15.609093-05
2	192.168.0.134	Main computer	2026-03-03 10:58:36.484362-05
3	::ffff:192.168.0.134	Main computer mapped	2026-03-03 10:58:36.492681-05
4	10.212.134.201	Local Virtual IP	2026-03-03 16:59:19.279751-05
5	::ffff:10.212.134.201	Local Virtual IP mapped	2026-03-03 16:59:19.291519-05
\.


--
-- Data for Name: settings_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings_types (id, name, max_allowed, min_allowed, hotel) FROM stdin;
8	Sick	32	\N	Holiday Inn & Suites -2565 Argentia
10	Birthday	1	\N	Holiday Inn & Suites -2565 Argentia
9	Bereavement	24	0	Holiday Inn & Suites -2565 Argentia
11	Vacation	\N	\N	Holiday Inn & Suites -2565 Argentia
14	Vacation	\N	\N	Holiday Inn Express & Suites - 5599 Ambler
16	Bereavement	24	\N	Holiday Inn Express & Suites - 5599 Ambler
15	Sick	24	\N	Holiday Inn Express & Suites - 5599 Ambler
31	Birthday	1	\N	Holiday Inn Express & Suites - 5599 Ambler
\.


--
-- Data for Name: settings_vacation_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings_vacation_options (id, label, max_allowed) FROM stdin;
1	10 days	10
2	15 days	15
3	20 days	20
\.


--
-- Data for Name: settings_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings_years (id, year) FROM stdin;
1	2024
2	2025
3	2026
4	2023
\.


--
-- Data for Name: sync_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_history (id, username, details, status, created_at, hotel) FROM stdin;
1	admin	Synced 57 employees. Updated 57 records.	OK	2025-12-30 19:17:36.250702-05	\N
2	admin	Sync failed: column "option_type" of relation "employee_vacation_option" does not exist	ERROR	2025-12-31 15:15:54.580801-05	\N
3	admin	Synced 57 employees. Updated 57 records.	OK	2025-12-31 15:16:16.622664-05	\N
4	admin	Sync failed: column "option_type" of relation "employee_vacation_option" does not exist	ERROR	2025-12-31 15:44:59.498208-05	\N
5	admin	Synced 57 employees. Updated 57 records.	OK	2025-12-31 15:46:57.960586-05	\N
6	admin	Synced 57 employees. Updated 57 records.	OK	2025-12-31 16:01:34.324608-05	\N
7	admin	Synced 96 employees. Updated 96 records.	OK	2025-12-31 16:05:11.689958-05	\N
8	admin	Synced 57 employees. Updated 57 records.	OK	2026-01-01 11:40:55.152201-05	\N
9	admin	Synced 57 employees. Updated 57 records.	OK	2026-01-05 10:08:26.803726-05	\N
10	admin	Synced 57 employees. Updated 57 records.	OK	2026-01-05 15:34:47.851106-05	\N
11	admin	Synced 96 employees. Updated 96 records.	OK	2026-01-05 15:38:00.226579-05	\N
12	admin	Synced 61 employees	Success	2026-01-06 09:21:46.557737-05	Holiday Inn & Suites -2565 Argentia
13	admin	Synced 57 employees. Updated 57 records.	OK	2026-01-06 09:21:55.119178-05	Holiday Inn & Suites -2565 Argentia
14	admin	Synced 61 employees	Success	2026-01-19 14:11:54.449966-05	Holiday Inn & Suites -2565 Argentia
15	admin	Synced 57 employees. Updated 57 records.	OK	2026-01-19 14:12:03.504927-05	Holiday Inn & Suites -2565 Argentia
16	admin	Synced 100 employees	Success	2026-01-19 14:13:40.331225-05	Holiday Inn Express & Suites - 5599 Ambler
17	admin	Synced 96 employees. Updated 96 records.	OK	2026-01-19 14:13:49.479895-05	Holiday Inn Express & Suites - 5599 Ambler
18	admin	Synced 100 employees	Success	2026-01-25 15:30:44.653666-05	Holiday Inn Express & Suites - 5599 Ambler
19	admin	Synced 96 employees. Updated 96 records.	OK	2026-01-25 15:30:53.800314-05	Holiday Inn Express & Suites - 5599 Ambler
20	admin	Synced 103 employees	Success	2026-02-17 10:24:38.798049-05	Holiday Inn Express & Suites - 5599 Ambler
21	admin	Synced 96 employees. Updated 96 records.	OK	2026-02-17 10:24:47.869236-05	Holiday Inn Express & Suites - 5599 Ambler
22	admin	Synced 65 employees	Success	2026-02-17 10:30:38.328008-05	Holiday Inn & Suites -2565 Argentia
23	admin	Synced 57 employees. Updated 57 records.	OK	2026-02-17 10:30:46.920448-05	Holiday Inn & Suites -2565 Argentia
24	admin	Synced 103 employees	Success	2026-02-18 08:37:04.317081-05	Holiday Inn Express & Suites - 5599 Ambler
25	admin	Synced 99 employees. Updated 99 records.	OK	2026-02-18 08:37:13.437435-05	Holiday Inn Express & Suites - 5599 Ambler
26	admin	Synced 65 employees	Success	2026-02-18 08:39:49.531961-05	Holiday Inn & Suites -2565 Argentia
27	admin	Synced 61 employees. Updated 61 records.	OK	2026-02-18 08:39:58.427057-05	Holiday Inn & Suites -2565 Argentia
28	admin	Synced 103 employees	Success	2026-02-22 10:06:35.207414-05	Holiday Inn Express & Suites - 5599 Ambler
29	admin	Synced 99 employees. Updated 99 records.	OK	2026-02-22 10:06:44.53542-05	Holiday Inn Express & Suites - 5599 Ambler
30	admin	Synced 103 employees	Success	2026-02-22 10:50:42.464123-05	Holiday Inn Express & Suites - 5599 Ambler
31	admin	Synced 99 employees. Updated 99 records.	OK	2026-02-22 10:50:51.887135-05	Holiday Inn Express & Suites - 5599 Ambler
32	admin	Synced 103 employees	Success	2026-02-22 10:57:09.456516-05	Holiday Inn Express & Suites - 5599 Ambler
33	admin	Synced 99 employees. Updated 99 records.	OK	2026-02-22 10:57:18.704686-05	Holiday Inn Express & Suites - 5599 Ambler
34	admin	Synced 65 employees	Success	2026-02-22 11:19:08.456008-05	Holiday Inn & Suites -2565 Argentia
35	admin	Synced 61 employees. Updated 61 records.	OK	2026-02-22 11:19:17.871613-05	Holiday Inn & Suites -2565 Argentia
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (key, value) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, salt, role, first_name, last_name, created_at, is_blocked) FROM stdin;
2	Test	2a052dc294882333651deb3ef7171ba4b4091156db38bae15ad73d6b72de2236327d0db809c73739462389dae9c66b1586b8ab2e59cf84850dce695833f3367f	7ebfb2422af0f0727fdeb0bc7258f89c	user	Test1f	test1l	2026-01-04 12:22:51.158854-05	f
3	Fayaz	01e302556fef41c34dde1e3777b2a5ff9475624942089db1fd42a3789ea59df799a44a1b10c7854df55459a58cf8b8a1e0435b9484839ac1fff2e90b9caff34e	30dea071f4e23b1f144352d2492689b5	admin	Fayaz	Jaffer	2026-01-09 09:14:06.242106-05	f
4	Mohamed	21f750d5d81e28a840a4c8335715d07e34884767530deab874aa8a5207490b7be573f3274112f57accae10f0305ac010f39010965731a69f64085b6634e640c4	176b90587d20d0e91be286913e94fb61	user	Mohamed	Jaffer	2026-01-09 09:20:26.092676-05	f
1	admin	73e9fffa32a05c62a0d03896736d9ffe8466f11c81fdf6bc0fcd0abd45cc3877961d6253d751dc6ce461ebeeaa3025eaac7d1ab3c2d445aa75500abb86f9200e	9e0998a097442c3b24394b0e8325ee9e	admin	System	Admin	2025-12-30 18:53:52.095151-05	f
\.


--
-- Name: employee_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_notes_id_seq', 7, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 5279, true);


--
-- Name: import_rows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_rows_id_seq', 1120, true);


--
-- Name: imports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imports_id_seq', 28, true);


--
-- Name: manual_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manual_entries_id_seq', 51, true);


--
-- Name: pto_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pto_balances_id_seq', 1119, true);


--
-- Name: settings_hotels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_hotels_id_seq', 3, true);


--
-- Name: settings_ip_allowlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_ip_allowlist_id_seq', 5, true);


--
-- Name: settings_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_types_id_seq', 979, true);


--
-- Name: settings_vacation_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_vacation_options_id_seq', 3, true);


--
-- Name: settings_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_years_id_seq', 4, true);


--
-- Name: sync_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_history_id_seq', 35, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: employee_notes employee_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_notes
    ADD CONSTRAINT employee_notes_pkey PRIMARY KEY (id);


--
-- Name: employee_vacation_option employee_vacation_option_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_vacation_option
    ADD CONSTRAINT employee_vacation_option_pkey PRIMARY KEY (hotel, employee);


--
-- Name: employees employees_employee_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_key_key UNIQUE (employee_key);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: import_rows import_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_rows
    ADD CONSTRAINT import_rows_pkey PRIMARY KEY (id);


--
-- Name: imports imports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imports
    ADD CONSTRAINT imports_pkey PRIMARY KEY (id);


--
-- Name: manual_entries manual_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manual_entries
    ADD CONSTRAINT manual_entries_pkey PRIMARY KEY (id);


--
-- Name: pto_balances pto_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pto_balances
    ADD CONSTRAINT pto_balances_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: settings_hotels settings_hotels_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_hotels
    ADD CONSTRAINT settings_hotels_name_key UNIQUE (name);


--
-- Name: settings_hotels settings_hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_hotels
    ADD CONSTRAINT settings_hotels_pkey PRIMARY KEY (id);


--
-- Name: settings_ip_allowlist settings_ip_allowlist_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_ip_allowlist
    ADD CONSTRAINT settings_ip_allowlist_ip_address_key UNIQUE (ip_address);


--
-- Name: settings_ip_allowlist settings_ip_allowlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_ip_allowlist
    ADD CONSTRAINT settings_ip_allowlist_pkey PRIMARY KEY (id);


--
-- Name: settings_types settings_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_types
    ADD CONSTRAINT settings_types_pkey PRIMARY KEY (id);


--
-- Name: settings_vacation_options settings_vacation_options_label_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_vacation_options
    ADD CONSTRAINT settings_vacation_options_label_key UNIQUE (label);


--
-- Name: settings_vacation_options settings_vacation_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_vacation_options
    ADD CONSTRAINT settings_vacation_options_pkey PRIMARY KEY (id);


--
-- Name: settings_years settings_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_years
    ADD CONSTRAINT settings_years_pkey PRIMARY KEY (id);


--
-- Name: settings_years settings_years_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings_years
    ADD CONSTRAINT settings_years_year_key UNIQUE (year);


--
-- Name: sync_history sync_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_history
    ADD CONSTRAINT sync_history_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_pto_balances_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pto_balances_employee_date ON public.pto_balances USING btree (employee_id, created_at DESC);


--
-- Name: settings_types_hotel_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX settings_types_hotel_name_key ON public.settings_types USING btree (hotel, name);


--
-- Name: employee_vacation_option employee_vacation_option_vacation_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_vacation_option
    ADD CONSTRAINT employee_vacation_option_vacation_option_id_fkey FOREIGN KEY (vacation_option_id) REFERENCES public.settings_vacation_options(id) ON DELETE RESTRICT;


--
-- Name: import_rows import_rows_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_rows
    ADD CONSTRAINT import_rows_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.imports(id) ON DELETE CASCADE;


--
-- Name: pto_balances pto_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pto_balances
    ADD CONSTRAINT pto_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: pto_balances pto_balances_import_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pto_balances
    ADD CONSTRAINT pto_balances_import_id_fkey FOREIGN KEY (import_id) REFERENCES public.imports(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qpPXXfLgE9InhjD4V3BjGlPixsib0IZUnKaVpC4QSDkQM5N4YgdTOHnLX03rZjb

