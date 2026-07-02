CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    auth_provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL',
    school_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    student_id VARCHAR(50),
    department VARCHAR(100),
    grade VARCHAR(30),
    bio TEXT,
    tech_stack TEXT,
    collaboration_status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    description TEXT,
    recruitment_status VARCHAR(30) NOT NULL DEFAULT 'RECRUITING',
    project_type VARCHAR(30) NOT NULL,
    collaboration_mode VARCHAR(30) NOT NULL,
    expected_member_count INT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT
);

CREATE TABLE portfolio_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) NOT NULL,
    reference_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_portfolio_items_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    applicant_user_id BIGINT NOT NULL,
    message TEXT,
    application_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_project
        FOREIGN KEY (project_id)
        REFERENCES projects (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_applications_applicant
        FOREIGN KEY (applicant_user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT uq_applications_project_applicant
        UNIQUE (project_id, applicant_user_id)
);

CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_profiles_department ON profiles (department);
CREATE INDEX idx_profiles_collaboration_status ON profiles (collaboration_status);
CREATE INDEX idx_projects_owner_user_id ON projects (owner_user_id);
CREATE INDEX idx_projects_recruitment_status ON projects (recruitment_status);
CREATE INDEX idx_projects_project_type ON projects (project_type);
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items (user_id);
CREATE INDEX idx_portfolio_items_item_type ON portfolio_items (item_type);
CREATE INDEX idx_applications_project_id ON applications (project_id);
CREATE INDEX idx_applications_applicant_user_id ON applications (applicant_user_id);
CREATE INDEX idx_applications_status ON applications (application_status);
