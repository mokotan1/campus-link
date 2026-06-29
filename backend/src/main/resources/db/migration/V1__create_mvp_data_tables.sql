create table users (
    id uuid primary key,
    email varchar(255) not null unique,
    password_hash varchar(255),
    campus varchar(80) not null,
    verification_status varchar(30) not null default 'pending',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint ck_users_verification_status
        check (verification_status in ('pending', 'verified', 'rejected'))
);

create index ix_users_campus on users (campus);
create index ix_users_verification_status on users (verification_status);

create table profiles (
    id uuid primary key,
    user_id uuid not null unique,
    display_name varchar(80) not null,
    major varchar(100),
    grade_year smallint,
    bio text,
    availability varchar(30) not null default 'available',
    collaboration_preference varchar(80),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_profiles_user
        foreign key (user_id) references users (id),
    constraint ck_profiles_grade_year
        check (grade_year is null or grade_year between 1 and 6),
    constraint ck_profiles_availability
        check (availability in ('available', 'limited', 'unavailable'))
);

create index ix_profiles_major on profiles (major);
create index ix_profiles_grade_year on profiles (grade_year);
create index ix_profiles_availability on profiles (availability);

create table profile_role_tags (
    id uuid primary key,
    profile_id uuid not null,
    role_tag varchar(60) not null,
    constraint fk_profile_role_tags_profile
        foreign key (profile_id) references profiles (id) on delete cascade,
    constraint ck_profile_role_tags_role
        check (role_tag in ('planner', 'designer', 'frontend', 'backend', 'mobile', 'data', 'pm')),
    constraint ux_profile_role_tags_profile_role
        unique (profile_id, role_tag)
);

create index ix_profile_role_tags_profile_id on profile_role_tags (profile_id);

create table profile_tool_tags (
    id uuid primary key,
    profile_id uuid not null,
    tool_tag varchar(60) not null,
    constraint fk_profile_tool_tags_profile
        foreign key (profile_id) references profiles (id) on delete cascade,
    constraint ux_profile_tool_tags_profile_tool
        unique (profile_id, tool_tag)
);

create index ix_profile_tool_tags_profile_id on profile_tool_tags (profile_id);

create table portfolio_items (
    id uuid primary key,
    profile_id uuid not null,
    title varchar(120) not null,
    description text,
    work_role varchar(80),
    visibility varchar(30) not null default 'private',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_portfolio_items_profile
        foreign key (profile_id) references profiles (id) on delete cascade,
    constraint ck_portfolio_items_visibility
        check (visibility in ('private', 'public'))
);

create index ix_portfolio_items_profile_id on portfolio_items (profile_id);
create index ix_portfolio_items_title on portfolio_items (title);
create index ix_portfolio_items_work_role on portfolio_items (work_role);
create index ix_portfolio_items_visibility on portfolio_items (visibility);

create table portfolio_links (
    id uuid primary key,
    portfolio_item_id uuid not null,
    label varchar(60) not null,
    url varchar(500) not null,
    created_at timestamp not null default current_timestamp,
    constraint fk_portfolio_links_item
        foreign key (portfolio_item_id) references portfolio_items (id) on delete cascade
);

create index ix_portfolio_links_item_id on portfolio_links (portfolio_item_id);

create table projects (
    id uuid primary key,
    owner_profile_id uuid not null,
    title varchar(140) not null,
    summary varchar(300),
    description text not null,
    project_type varchar(40) not null default 'side_project',
    status varchar(30) not null default 'draft',
    campus varchar(80),
    recruitment_deadline date,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_projects_owner_profile
        foreign key (owner_profile_id) references profiles (id),
    constraint ck_projects_project_type
        check (project_type in ('study', 'side_project', 'competition', 'startup', 'research')),
    constraint ck_projects_status
        check (status in ('draft', 'recruiting', 'closed', 'archived'))
);

create index ix_projects_owner_profile_id on projects (owner_profile_id);
create index ix_projects_title on projects (title);
create index ix_projects_project_type on projects (project_type);
create index ix_projects_status on projects (status);
create index ix_projects_campus on projects (campus);
create index ix_projects_deadline on projects (recruitment_deadline);

create table project_required_roles (
    id uuid primary key,
    project_id uuid not null,
    role_tag varchar(60) not null,
    required_count smallint not null default 1,
    constraint fk_project_required_roles_project
        foreign key (project_id) references projects (id) on delete cascade,
    constraint ck_project_required_roles_role
        check (role_tag in ('planner', 'designer', 'frontend', 'backend', 'mobile', 'data', 'pm')),
    constraint ck_project_required_roles_count
        check (required_count between 1 and 20),
    constraint ux_project_required_roles_project_role
        unique (project_id, role_tag)
);

create index ix_project_required_roles_project_id on project_required_roles (project_id);

create table project_tags (
    id uuid primary key,
    project_id uuid not null,
    tag varchar(60) not null,
    constraint fk_project_tags_project
        foreign key (project_id) references projects (id) on delete cascade,
    constraint ux_project_tags_project_tag
        unique (project_id, tag)
);

create index ix_project_tags_project_id on project_tags (project_id);

create table applications (
    id uuid primary key,
    project_id uuid not null,
    applicant_profile_id uuid not null,
    portfolio_item_id uuid,
    message text,
    status varchar(30) not null default 'pending',
    submitted_at timestamp not null default current_timestamp,
    reviewed_at timestamp,
    reviewed_by_profile_id uuid,
    decision_reason varchar(500),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_applications_project
        foreign key (project_id) references projects (id),
    constraint fk_applications_applicant_profile
        foreign key (applicant_profile_id) references profiles (id),
    constraint fk_applications_portfolio_item
        foreign key (portfolio_item_id) references portfolio_items (id),
    constraint fk_applications_reviewed_by_profile
        foreign key (reviewed_by_profile_id) references profiles (id),
    constraint ck_applications_status
        check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
    constraint ux_applications_project_applicant
        unique (project_id, applicant_profile_id)
);

create index ix_applications_project_id on applications (project_id);
create index ix_applications_applicant_profile_id on applications (applicant_profile_id);
create index ix_applications_portfolio_item_id on applications (portfolio_item_id);
create index ix_applications_status on applications (status);
create index ix_applications_submitted_at on applications (submitted_at);

create table proposals (
    id uuid primary key,
    project_id uuid not null,
    sender_profile_id uuid not null,
    receiver_profile_id uuid not null,
    message text,
    status varchar(30) not null default 'pending',
    sent_at timestamp not null default current_timestamp,
    responded_at timestamp,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    constraint fk_proposals_project
        foreign key (project_id) references projects (id),
    constraint fk_proposals_sender_profile
        foreign key (sender_profile_id) references profiles (id),
    constraint fk_proposals_receiver_profile
        foreign key (receiver_profile_id) references profiles (id),
    constraint ck_proposals_distinct_profiles
        check (sender_profile_id <> receiver_profile_id),
    constraint ck_proposals_status
        check (status in ('pending', 'accepted', 'rejected', 'cancelled'))
);

create index ix_proposals_project_id on proposals (project_id);
create index ix_proposals_sender_profile_id on proposals (sender_profile_id);
create index ix_proposals_receiver_profile_id on proposals (receiver_profile_id);
create index ix_proposals_status on proposals (status);
create index ix_proposals_sent_at on proposals (sent_at);
