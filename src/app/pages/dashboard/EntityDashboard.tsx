// src/app/pages/dashboard/EntityDashboard.js

import React from 'react';
import { KTSVG } from '../../../_metronic/helpers';
import { Link } from 'react-router-dom';

const entities = [
  { name: 'Hitos', route: '/hitos', icon: 'flag' },
  { name: 'Procesos', route: '/procesos', icon: 'flow' },
  { name: 'Plantillas', route: '/plantillas', icon: 'copy' },
  { name: 'Clientes', route: '/clientes', icon: 'user' }
];

const EntityDashboard = () => {
  return (
    <div className="row g-5 g-xl-8">
      {entities.map((entity, index) => (
        <div className="col-xl-3" key={index}>
          <Link to={entity.route} className="card bg-light-primary hoverable">
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <KTSVG path={`/media/icons/duotune/general/gen${index + 1}.svg`} className="svg-icon svg-icon-3x me-3" />
                <h3 className="text-dark">{entity.name}</h3>
              </div>
              <p className="text-muted">Gestionar {entity.name.toLowerCase()}</p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default EntityDashboard;
