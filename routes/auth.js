const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const connection = require('./db/db');
const bcrypt = require('bcrypt');

exports.protectRoute = async (req, res, next) => {
    if (req.cookies.jwt_user) {
        try {
            const tokenAuthorized = await promisify(jwt.verify)(req.cookies.jwt_user, 'sj');
            if (tokenAuthorized) {
                req.user = tokenAuthorized;
                return next();
            }
        } catch (error) {
            console.log(error);
        }
    }
    res.redirect("/login");
};


exports.protectRouteAdmin = async (req, res, next) => {
    if (req.cookies.jwt_admin) {
        try {
            const tokenAuthorized = await promisify(jwt.verify)(req.cookies.jwt_admin, 'admin');
            if (tokenAuthorized) {
                req.user = tokenAuthorized;
                return next();
            }
        } catch (error) {
            console.log(error);
        }
    }
    res.redirect("/login_admin");
};

exports.protectRouteAdminLogout = async (req, res, next) => {
    if (req.cookies.jwt_admin) {
        try {
            const tokenAuthorized = await promisify(jwt.verify)(req.cookies.jwt_admin, 'admin');
            if (tokenAuthorized) {
                return res.redirect('/estadisticas');
            }
        } catch (error) {
            console.log(error);
        }
    }
    next();
}

        
exports.protectRouteLogOut = async (req, res, next) => {
    if (req.cookies.jwt_user) {
        try {
            const tokenAuthorized = await promisify(jwt.verify)(req.cookies.jwt_user, 'sj');
            if (tokenAuthorized) {
                return res.redirect('/');
            }
        } catch (error) {
            console.log(error);
        }
    }
    next();
}

exports.login = async (req, res) => {
    const { cedula, contrasena } = req.body;
    connection.query("SELECT * FROM usuarios WHERE cédula = ?", [cedula], (err, rows) => {
        if (err) {
            console.error("Error de base de datos:", err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
        if (rows.length > 0) {
            const user = rows[0];
            bcrypt.compare(contrasena, user.contraseña, (err, isMatch) => {
                if (err) {
                    console.error("Error comparando el hash con la contrasena:", err);
                    return res.status(500).json({ message: 'Error interno del servidor' });
                }
                if (isMatch) {
                    console.log(user.persona_id)
                    const token = jwt.sign(
                        { persona_id: user.persona_id }, 'sj',
                        { expiresIn: '1h' }
                    );
                    res.cookie('jwt_user', token);
                    return res.status(200).json({ message: 'Inicio de sesión exitoso' });
                } else {
                    return res.status(401).json({ message: 'Cédula o contraseña incorrectas.' });
                }
            });
        } else {
            return res.status(401).json({ message: 'Cédula o contraseña incorrectas.' });
        }
    });
}


exports.loginadmin = async (req, res) => {
    const { cedula, contrasena } = req.body;
    connection.query("SELECT * FROM usuarios WHERE cédula = ?", [cedula], (err, rows) => {
        if (err) {
            console.error("Error de base de datos:", err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
        if (rows.length > 0) {
            const user = rows[0];
            if (user.rol == 'Líder de Calle' || user.rol == 'Administrador') {
                bcrypt.compare(contrasena, user.contraseña, (err, isMatch) => {
                    if (err) {
                        console.error("Error comparando el hash con la contrasena:", err);
                        return res.status(500).json({ message: 'Error interno del servidor' });
                    }
                    if (isMatch) {
                        const token = jwt.sign(
                            { persona_id: user.persona_id, rol: user.rol }, 'admin',
                            { expiresIn: '1h' }
                        );
                        res.cookie('jwt_admin', token);
                        return res.status(200).json({ message: 'Inicio de sesión exitoso' });
                    } else {
                        return res.status(401).json({ message: 'Cédula o contraseña incorrectas.' });
                    }
                });
            }
            else{
                return res.status(401).json({ message: 'Acceso no autorizado.' });
            }
        } else {
            return res.status(401).json({ message: 'Cédula o contraseña incorrectas.' });
        }
    });
}




exports.logout = async (req, res) => {
    res.clearCookie("jwt_user");
    res.redirect("/login");
}

exports.logoutAdmin = async (req, res) => {
    res.clearCookie("jwt_admin");
    res.redirect("/estadisticas");
}