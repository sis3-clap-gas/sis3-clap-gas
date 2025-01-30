const express = require('express');
const router = express.Router();
const connection = require('./db/db');
const cdn = require('./cdn/config');
const bcrypt = require('bcrypt');
const auth = require('./auth');
const upload = require('./cdn/config');
require("dotenv").config();
const saltRounds = 10;


const formattedDateTime = (() => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'P.M.' : 'A.M.';
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = String(hours).padStart(2, '0');
  const formattedDate = `${day}-${month}-${year}`;
  const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
  return `${formattedDate} ${formattedTime}`;
})();


router.get('/agregar_usuarios', auth.protectRouteAdmin, (req, res) => {
  const query = "SELECT * FROM calles";
  connection.query(query, (err, row) => {
    res.render('agregar_usuarios', {
      rol: req.user.rol,
      persona_id: req.user.persona_id,
      calle: row
    })
  })
})




router.get('/', auth.protectRoute, function (req, res, next) {
  const { persona_id } = req.user;
  const query = "SELECT * FROM notificaciones WHERE persona_id = ?";
  connection.query(query, [persona_id], (err, row) => {
    const numeroNotificaciones = row.length;
    res.render('index', {
      notificaciones: row,
      numeroNotificaciones: numeroNotificaciones
    });
  })
});

router.get('/agregarfamilias', auth.protectRouteAdmin, (req, res) => {
  const query1 = "SELECT p.persona_id,p.nombre, p.apellido FROM usuarios u INNER JOIN personas p ON u.persona_id = p.persona_id;"
  const query2 = "SELECT p.persona_id, p.nombre, p.apellido, lc.id AS lidercalle_calles_id FROM usuarios u INNER JOIN personas p ON u.persona_id = p.persona_id INNER JOIN lidercalle_calles lc ON u.usuario_id = lc.usuario_id WHERE u.rol = 'Líder de Calle';"
  connection.query(query1, (err, row) => {
    connection.query(query2, (err, row2) => {
      res.render('familias', {
        rol: req.user.rol,
        calle: row,
        personas: row2
      })
    })
  })
});

router.get('/agregarcalles', auth.protectRouteAdmin, (req, res) => {
  res.render('agregar_calles', {
    rol: req.user.rol
  })
})


router.get('/inventario/edit/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM inventario WHERE inventario_id = ?`;
  connection.query(query, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener los datos del inventario:', err);
      return res.status(500).send('Error al cargar datos del inventario');
    }

    const producto = row[0];
    res.render('editar_inventario', {
      rol: req.user.rol,
      producto
    });
  });
});

// Ahora hazme el post del editar inventario sin el tipo
router.post('/edit/inventario/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const { cantidad_disponible, precio_unitario } = req.body;
  const query = `UPDATE inventario SET cantidad_disponible = ?, precio_unitario = ? WHERE inventario_id = ?`;
  connection.query(query, [cantidad_disponible, precio_unitario, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el inventario:', err);
      return res.status(500).send('Error al editar inventario');
    }
    res.redirect('/inventario_panel');
  });
});





router.get('/calles/edit/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM calles WHERE calle_id = ?"
  connection.query(query, id, (err, row) => {
    if (err) {
      console.log(err)
    } else {
      const calle = row[0]
      res.render('editar_calles', {
        rol: req.user.rol,
        calle: calle
      })
    }
  })
})

router.post('/agregarcalles/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const { calle } = req.body;
  const query = "UPDATE calles SET nombre_calle = ? WHERE calle_id = ?";
  connection.query(query, [calle, id], (err, row) => {
    err ? console.log(err) : res.redirect('/calles_panel')
  })

})


router.post('/agregarcalles', auth.protectRouteAdmin, (req, res) => {
  const { calle } = req.body;
  const query = "INSERT INTO calles(nombre_calle) VALUES(?)";
  connection.query(query, calle, (err, row) => {
    err ? console.log(err) : res.redirect('/calles_panel')
  })
})



router.post('/familias', (req, res) => {
  const { lider, personas, familia, miembros } = req.body;
  const query1 = "INSERT INTO familias(persona_id,liderdecalle_id,nombre_familia,cantidad_miembros) VALUES(?,?,?,?);";
  connection.query(query1, [personas, lider, familia, miembros], (err, row) => {
    err ? console.log(err) : res.redirect('/calles_panel')
  })
});


router.get('/familiaporcalle/edit/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  console.log(id)
  const queryFamilia = `
    SELECT f.*, p1.nombre AS jefe_nombre, p1.apellido AS jefe_apellido, p3.nombre AS lider_nombre, p3.apellido AS lider_apellido FROM familias f INNER JOIN personas p1 ON f.persona_id = p1.persona_id INNER JOIN lidercalle_calles lc ON f.liderdecalle_id = lc.id INNER JOIN usuarios p2 ON lc.usuario_id = p2.usuario_id INNER JOIN personas p3 ON p3.persona_id = p2.persona_id WHERE f.familia_id = ?`;
  const queryCalle = "SELECT persona_id, nombre, apellido FROM personas";
  const queryLider = `
    SELECT lc.id AS lidercalle_calles_id, p.nombre, p.apellido 
    FROM lidercalle_calles lc
    INNER JOIN usuarios u ON lc.usuario_id = u.usuario_id
    INNER JOIN personas p ON u.persona_id = p.persona_id
    WHERE u.rol = 'Líder de Calle'
  `;

  connection.query(queryFamilia, [id], (err, rows) => {
    if (err) {
      console.error('Error al obtener los datos de la familia:', err);
      return res.status(500).send('Error al cargar datos de la familia');
    }

    const familia = rows[0];
    console.log('Familia: ', familia)
    connection.query(queryCalle, (err, calle) => {
      if (err) console.log(err);
      connection.query(queryLider, (err, personas) => {
        if (err) console.log(err);
        res.render('editar_familia', {
          rol: req.user.rol,
          familia,
          calle,
          personas
        });
      });
    });
  });
});



router.post('/editarfamilia/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const { personas, lider, familia, miembros } = req.body;
  const queryUpdateFamilia = `
    UPDATE familias 
    SET nombre_familia = ?, 
        cantidad_miembros = ?, 
        persona_id = ?, 
        liderdecalle_id = ? 
    WHERE familia_id = ?
  `;

  connection.query(
    queryUpdateFamilia,
    [familia, miembros, personas, lider, id],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar la familia:', err);
        return res.status(500).send('Error al editar familia');
      }

      res.redirect('/calles_panel'); // Redirigir después de la edición exitosa
    }
  );
});





router.post('/agregarusuarios', async (req, res) => {
  const { nombre, apellido, cedula, direccion, calle, telefono, fechadenacimiento, rol } = req.body;
  const hashedPassword = await bcrypt.hash(cedula, saltRounds);
  const checkCedulaQuery = "SELECT * FROM usuarios WHERE cédula = ?";
  connection.query(checkCedulaQuery, [cedula], async (err, results) => {
    if (err) {
      console.error('Error al verificar la cédula:', err);
      return res.status(500).send('Error al agregar usuario');
    }

    if (results.length > 0) {
      return res.status(400).send('Error: La cédula ya está registrada');
    }
    const query2 = "INSERT INTO personas(nombre,apellido,telefono,direccion,calle_id) VALUES(?,?,?,?,?)";
    const query1 = "INSERT INTO usuarios(persona_id,rol,cédula,contraseña,fecha_nacimiento) VALUES(?,?,?,?,?)";
    const query3 = "INSERT INTO lidercalle_calles(usuario_id,calle_id) VALUES(?,?)";
    const casa = direccion;
    connection.query(query2, [nombre, apellido, telefono, casa, calle], async (err, row) => {
      if (err) {
        console.error('Error al insertar persona:', err);
        return res.status(500).send('Error al agregar usuario');
      }
      connection.query(query1, [row.insertId, rol, cedula, hashedPassword, fechadenacimiento], async (err, rowLider) => {
        if (err) {
          console.error('Error al insertar usuario:', err);
          return res.status(500).send('Error al agregar usuario');
        }
        if (rol == 'Líder de Calle') {
          connection.query(query3, [rowLider.insertId, calle], (err, rowCalle) => {
            if (err) {
              console.error('Error al asociar líder de calle:', err);
              return res.status(500).send('Error al agregar usuario');
            }
            res.redirect('/admin_panel');
          });
        } else {
          res.redirect('/admin_panel');
        }
      });
    });
  });
});


router.get('/logout', (req, res) => auth.logout(req, res));
router.get('/logoutAdmin', (req, res) => auth.logoutAdmin(req, res));
router.get('/clap/:id', auth.protectRoute, (req, res) => {
  const { id } = req.params;
  const { persona_id } = req.user;
  const query5 = `SELECT * FROM notificaciones WHERE persona_id = ?;`
  const query = `SELECT i.*, f.* FROM inventario AS i 
                 JOIN familias AS f ON f.persona_id = ? 
                 WHERE i.inventario_id = ?;`;
  const query3 = `SELECT ldc.id, p.nombre, p.apellido, c.nombre_calle, p.direccion 
                  FROM lidercalle_calles ldc 
                  INNER JOIN usuarios u ON ldc.usuario_id = u.usuario_id 
                  INNER JOIN personas p ON u.persona_id = p.persona_id 
                  INNER JOIN calles c ON p.calle_id = c.calle_id 
                  WHERE ldc.id = ?;`;
  const query4 = `SELECT c.nombre_calle, p.direccion 
                  FROM personas p 
                  INNER JOIN calles c ON c.calle_id = p.calle_id 
                  WHERE p.persona_id = ?`;
  connection.query(query, [persona_id, id], (err, row) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(404).json({ message: "Error en el servidor." });
    }
    if (!row || row.length === 0) {
      return res.status(404).json({ message: "Familia no encontrada" });
    }
    const familia = row[0];
    if (!familia.liderdecalle_id) {
      return res.status(404).json({ message: "Líder de Calle no encontrado" });
    }
    connection.query(query3, [familia.liderdecalle_id], (err, rowQuery) => {
      if (err) {
        console.error('Error en la consulta del líder:', err);
        return res.status(404).json({ message: "Error en el servidor" });
      }
      const lider = rowQuery[0] || null;
      connection.query(query4, [persona_id], (err, rowCalle) => {
        if (err) {
          console.error('Error en la consulta de la calle:', err);
          return res.status(404).json({ message: "Error en el servidor" });
        }

        const calle = rowCalle[0] || null;
        const bolsaaPagar = Math.round(familia.cantidad_miembros / 3);
        console.log(bolsaaPagar)
        const costo = familia.precio_unitario * bolsaaPagar;
        connection.query(query5, [persona_id], (err, rowNotify) => {
          const numeroNotificaciones = rowNotify.length
          res.render('clap', {
            familia: familia,
            lider: lider,
            costo: costo,
            bolsasaPagar: bolsaaPagar,
            calle: calle,
            notificaciones: rowNotify,
            numeroNotificaciones: numeroNotificaciones
          })
        });
      });
    });
  });
});


router.get('/gas/:id', auth.protectRoute, (req, res) => {
  const { id } = req.params;
  const { persona_id } = req.user;
  const query5 = `SELECT * FROM notificaciones WHERE persona_id = ?;`
  const query = `SELECT i.*, f.* FROM inventario AS i JOIN familias AS f ON f.persona_id = ? WHERE i.inventario_id = ?;`;
  const query3 = "SELECT ldc.id, p.nombre, p.apellido, c.nombre_calle, p.direccion FROM lidercalle_calles ldc INNER JOIN usuarios u ON ldc.usuario_id = u.usuario_id INNER JOIN personas p ON u.persona_id = p.persona_id INNER JOIN calles c ON p.calle_id = c.calle_id WHERE ldc.id = ?;";
  const query4 = "SELECT c.nombre_calle, p.direccion FROM personas p INNER JOIN calles c ON c.calle_id = p.calle_id WHERE p.persona_id = ?";
  connection.query(query, [persona_id, id], (err, row) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(404).json({ message: "Error en el servidor." });
    }
    if (!row || row.length === 0) {
      return res.status(404).json({ message: "Familia no encontrada" });
    }

    connection.query(query3, row[0].liderdecalle_id, (err, rowQuery) => {
      connection.query(query4, persona_id, (err, rowCalle) => {
        let familia = row[0]
        if (!familia.liderdecalle_id) {
          return res.status(404).json({ message: "Líder de Calle no encontrado" });
        }
        const lider = rowQuery[0];
        const calle = rowCalle[0]
        const bolsaaPagar = Math.round(familia.cantidad_miembros / 3);
        const costo = familia.precio_unitario * bolsaaPagar;
        connection.query(query5, [persona_id], (err, rowNotify) => {
          const numeroNotificaciones = rowNotify.length
          res.render('gas', {
            familia: familia,
            lider: lider,
            costo: costo,
            bolsasaPagar: bolsaaPagar,
            calle: calle,
            notificaciones: rowNotify,
            numeroNotificaciones: numeroNotificaciones
          })
        });
      })
    })
  })
});



router.post("/upload/:id", auth.protectRoute, upload.single('file'), (req, res) => {
  try {
    const { id } = req.params;
    const { persona_id } = req.user;
    const { reference, liderdecalle_id, cantidad, precio_total } = req.body;
    const fileUrl = req.file.path;
    const query2 = "INSERT INTO pagos(persona_id,inventario_id,liderdecalle_id,fecha,cantidad,precio_total) VALUES(?,?,?,?,?,?)";
    const query1 = "INSERT INTO entregas(persona_id,entrega_id,referencia_pago,imagen_comprobante,estado) VALUES(?,?,?,?,?);";
    connection.query(query2, [persona_id, id, liderdecalle_id, formattedDateTime, cantidad, precio_total], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error en el proceso de pago" });
      }
      const id_entrega = row.insertId;
      connection.query(query1, [persona_id, id_entrega, reference, fileUrl, "Pendiente"], (err, rowPago) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error en el proceso de entrega" });
        }
        return res.status(200).json({ message: "Pago enviado correctamente" });
      })
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar los datos" });
  }
});

router.get('/login', auth.protectRouteLogOut, (req, res) => {
  res.render('login')
})

router.post('/login', (req, res) => {
  auth.login(req, res);
})

router.get('/login_admin', auth.protectRouteAdminLogout, (req, res) => {
  res.render('login_admin')
})

router.post('/login_admin', (req, res) => {
  auth.loginadmin(req, res)


})

router.get('/admin_panel', auth.protectRouteAdmin, (req, res) => {
  const query = `SELECT 
  p.persona_id AS id, 
  p.nombre AS nombre, 
  p.apellido AS apellido, 
  p.telefono AS telefono, 
  u.cédula AS cedula, 
  u.rol AS rol FROM usuarios u 
  INNER JOIN personas p ON u.persona_id = p.persona_id;`;
  const rol = req.user.rol;
  const persona_id = req.user.persona_id;
  connection.query(query, (err, rows) => {
    if (err) {
      return res.status(500).send('Error al realizar la consulta');
    }

    let usuariosFiltrados = rows;
    if (rol === 'Líder de Calle') {
      usuariosFiltrados = rows.filter(user => user.rol !== 'Administrador' && user.rol !== 'Líder de Calle');
    }

    res.render('admin_panel', {
      rol,
      persona_id: persona_id,
      usuario: usuariosFiltrados
    });
  });
});


router.get('/estadisticas', auth.protectRouteAdmin, async (req, res) => {
  const fetchUrl = await fetch("https://ve.dolarapi.com/v1/dolares");
  const data = await fetchUrl.json();
  const price = data[0].promedio;


  const query = `SELECT u.rol, COUNT(*) AS cantidad
                 FROM usuarios u
                 GROUP BY u.rol`;

  const queryPayment = `
    SELECT 
      SUM(CASE WHEN e.estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
      SUM(CASE WHEN e.estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobados,
      SUM(CASE WHEN e.estado = 'Rechazado' THEN 1 ELSE 0 END) AS rechazados,
      (SELECT COUNT(*) FROM usuarios u LEFT JOIN entregas e ON u.persona_id = e.persona_id WHERE e.entrega_id IS NULL) AS sin_pagar
    FROM 
      entregas e
  `;

  const queryInventario = `SELECT tipo, cantidad_disponible FROM inventario`;

  const queryPagoTotal = `
    SELECT SUM(p.precio_total) AS totalPagos
    FROM pagos p
    INNER JOIN entregas e ON p.entrega_id = e.entrega_id
    WHERE e.estado = 'Aprobado'
  `;

  const rol = req.user.rol;

  connection.query(query, (err, rows) => {
    if (err) {
      return res.status(500).send('Error al realizar la consulta');
    }

    connection.query(queryInventario, (err, rowInventario) => {
      connection.query(queryPayment, (err, rowPayment) => {
        connection.query(queryPagoTotal, (err, rowPagoTotal) => {
          if (err) {
            return res.status(500).send('Error al realizar la consulta de pagos');
          }
          const bcv = rowPagoTotal[0].totalPagos / price;
          res.render('estadisticas', {
            rol,
            usuariosPorRol: rows,
            pagosPorEstado: rowPayment[0],
            inventario: rowInventario,
            tasa: price,
            bcv: bcv.toFixed(2),
            totalPagosAprobados: rowPagoTotal[0]?.totalPagos || 0 // Asegurándonos de que no haya errores si no hay resultados
          });
        });
      });
    });
  });
});






router.get('/calles_panel', auth.protectRouteAdmin, (req, res) => {
  const query = `SELECT f.familia_id as id, 
    p.nombre, 
    p.apellido, 
    p.direccion, 
    c.nombre_calle, 
    f.nombre_familia, 
    f.cantidad_miembros FROM personas p 
    INNER JOIN calles c ON c.calle_id = p.calle_id INNER JOIN familias f ON f.persona_id = p.persona_id;`;
  const query1 = "SELECT * FROM calles"
  connection.query(query, (err, row) => {
    connection.query(query1, (err, rowCalle) => {
      res.render('calles_panel', {
        rol: req.user.rol,
        persona_id: req.user.persona_id,
        usuario: row,
        calles: rowCalle
      })
    })
  })
})


router.get('/inventario_panel', auth.protectRouteAdmin, (req, res) => {
  const query = "SELECT * FROM inventario"
  connection.query(query, (err, row) => {
    res.render('inventario_panel', {
      rol: req.user.rol,
      persona_id: req.user.persona_id,
      usuario: row
    })
  })
})




router.get('/pagos_panel', auth.protectRouteAdmin, (req, res) => {
  const query = `SELECT DISTINCT
  e.pago_id, 
  e.entrega_id, 
  e.referencia_pago, 
  e.imagen_comprobante, 
  e.estado, 
  CONCAT(p1.nombre, ' ', p1.apellido) AS jefe, 
  CONCAT(p2.nombre, ' ', p2.apellido) AS lider, 
  c.nombre_calle AS nombre_calle, 
  p1.direccion AS direccion_jefe, 
  p.fecha, 
  p.cantidad, 
  p.precio_total 
FROM entregas e 
INNER JOIN familias f ON e.persona_id = f.persona_id 
INNER JOIN personas p1 ON f.persona_id = p1.persona_id -- Jefe de hogar
INNER JOIN lidercalle_calles lc ON f.liderdecalle_id = lc.id 
INNER JOIN calles c ON lc.calle_id = c.calle_id  
INNER JOIN usuarios u ON lc.usuario_id = u.usuario_id 
INNER JOIN personas p2 ON u.persona_id = p2.persona_id  
INNER JOIN pagos p ON e.entrega_id = p.entrega_id;
  `
  connection.query(query, (err, row) => {
    console.log('Pagos: ', row);

    res.render('pagos_panel', {
      rol: req.user.rol,
      persona_id: req.user.persona_id,
      usuario: row
    })
  })
})

router.get('/aprobar/:id', (req, res) => {
  const entregaId = req.params.id;
  const aprobado = "Aprobado";
  const query1 = "SELECT persona_id, cantidad, inventario_id FROM pagos WHERE entrega_id = ?";
  const query4 = "INSERT INTO notificaciones(persona_id, mensaje, fecha_creacion) VALUES(?,?,?)";
  const query5 = "SELECT * FROM entregas WHERE persona_id = ?";
  connection.query(query1, [entregaId], (err, row) => {
    if (err) {
      console.error("Error al obtener datos del pago:", err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }
    const persona_id = row[0].persona_id;
    const can = row[0].cantidad;
    const inventarioId = row[0].inventario_id;
    connection.query("SELECT cantidad_disponible FROM inventario WHERE inventario_id = ?", [inventarioId], (err, rowInventario) => {
      if (err) {
        console.error("Error al obtener cantidad disponible del inventario:", err);
        return res.status(500).json({ message: 'Error en la base de datos' });
      }
      const canInven = rowInventario[0].cantidad_disponible;
      const totalProduct = canInven - can;
      connection.query("UPDATE inventario SET cantidad_disponible = ? WHERE inventario_id = ?", [totalProduct, inventarioId], (err, rowInven) => {
        if (err) {
          console.error("Error al actualizar la cantidad disponible en inventario:", err);
          return res.status(500).json({ message: 'Error en la base de datos' });
        }
        const queryUpdateEntrega = "UPDATE entregas SET estado = ? WHERE entrega_id = ?";
        connection.query(queryUpdateEntrega, [aprobado, entregaId], (err, row1) => {
          if (err) {
            console.error("Error al actualizar el estado de la entrega:", err);
            return res.status(500).json({ message: 'Error en la base de datos' });
          }
          connection.query(query5, [persona_id], (err, row3) => {
            if (err) {
              console.error("Error al obtener datos de la entrega:", err);
              return res.status(500).json({ message: 'Error en la base de datos' });
            }
            const reference = row3[0].referencia_pago;
            const mensaje = "Su pago con número de referencia " + reference + " fue aprobado.";
            connection.query(query4, [persona_id, mensaje, formattedDateTime], (err, row2) => {
              if (err) {
                console.error("Error al insertar notificación:", err);
                return res.status(500).json({ message: 'Error en la base de datos' });
              }
              return res.status(200).json({ message: 'Pago aprobado' });
            });
          });
        });
      });
    });
  });
});


router.get('/rechazar/:id', (req, res) => {
  const { id } = req.params;
  const rechazado = 'Rechazado';
  const query = "UPDATE entregas SET estado = ? WHERE entrega_id = ?";
  connection.query(query, [rechazado, id], (err, row) => {
    return res.status(200).json({ message: 'Pago rechazado' });
  })
})


router.get('/usuarios/delete/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM personas WHERE persona_id = ?;";
  connection.query(query, [id], (err, row) => {
    if (err) console.log(err);
    res.redirect('/admin_panel')
  })
})


router.get('/calles/delete/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM calles WHERE calle_id = ?;";
  connection.query(query, [id], (err, row) => {
    res.redirect('/calles_panel');
  })
})


router.get('/familias/delete/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM familias WHERE familia_id = ?;";
  connection.query(query, [id], (err, row) => {
    res.redirect('/calles_panel');
  })
})

// Ruta para mostrar el formulario de edición por id
router.get('/editarusuario/:id', auth.protectRouteAdmin, (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT u.*, p.* FROM usuarios u INNER JOIN personas p ON u.persona_id = p.persona_id WHERE p.persona_id = ?;
`;

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener usuario:', err);
      return res.status(500).send('Error al cargar datos del usuario');
    }

    if (results.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const usuario = results[0];

    // Obtener calles para el select
    const queryCalles = "SELECT * FROM calles";
    connection.query(queryCalles, (err, calles) => {
      if (err) {
        console.error('Error al obtener calles:', err);
        return res.status(500).send('Error al cargar calles');
      }

      res.render('editar_usuarios_edit', {
        rol: req.user.rol,
        usuario,
        calles
      });
    });
  });
});

router.post('/editarusuario/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, cedula, direccion, calle, telefono, fechadenacimiento, rol } = req.body;
  const hashedPassword = await bcrypt.hash(cedula, saltRounds);
  const casa = direccion.trim();
  const query1 = `UPDATE personas SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, calle_id = ? WHERE persona_id = (SELECT persona_id FROM usuarios WHERE usuario_id = ?)`;
  const query2 = `UPDATE usuarios SET cédula = ?, contraseña = ?, fecha_nacimiento = ?, rol = ? WHERE usuario_id = ?`;
  connection.query(query1, [nombre, apellido, telefono, casa, calle, id], (err) => {
    if (err) {
      console.error('Error al actualizar datos de persona:', err);
      return res.status(500).send('Error al editar usuario');
    }

    connection.query(query2, [cedula, hashedPassword, fechadenacimiento, rol, id], (err) => {
      if (err) {
        console.error('Error al actualizar datos de usuario:', err);
        return res.status(500).send('Error al editar usuario');
      }

      if (rol === 'Líder de Calle') {
        const query3 = "REPLACE INTO lidercalle_calles (usuario_id, calle_id) VALUES (?, ?)";
        connection.query(query3, [id, calle], (err) => {
          if (err) {
            console.error('Error al asociar líder de calle:', err);
            return res.status(500).send('Error al editar usuario');
          }
          res.redirect('/admin_panel');
        });
      } else {
        const queryDelete = "DELETE FROM lidercalle_calles WHERE usuario_id = ?";
        connection.query(queryDelete, [id], (err) => {
          if (err) {
            console.error('Error al eliminar asociación de líder de calle:', err);
            return res.status(500).send('Error al editar usuario');
          }
          res.redirect('/admin_panel');
        });
      }
    });
  });
});






router.get('/ayuda', auth.protectRouteAdmin,(req, res) => {
  res.render('ayuda', {
    rol: req.user.rol
  })
})




module.exports = router;
