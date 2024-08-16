import User from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const { userName, fullName, phone } = req.body;

        const candidate = await User.findOne({ userName });

        if (candidate) {
            return res.status(409).json({
                message: "Пользователь с таким именем уже существует",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);

        const doc = new User({
            userName,
            fullName,
            password: hash,
            phone,
        });

        const user = await doc.save();

        const accessToken = jwt.sign({ user: user }, process.env.SecretKey, {
            expiresIn: "1d",
        });

        const refreshToken = jwt.sign(
            { user: user },
            process.env.SecretKeyRefresh,
            {
                expiresIn: "30d",
            }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Убедись, что это включено в продакшене
            sameSite: "Strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // Время жизни cookies (30 дней)
        });

        res.json({ accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Не удалось зарегистрировать пользователя",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { userName } = req.body;

        console.log(userName);
        const candidate = await User.findOne({ userName });

        if (!candidate) {
            return res.status(404).json({
                message: "Неверный логин или пароль1",
            });
        }

        const isValidPass = await bcrypt.compare(
            req.body.password,
            candidate.password
        );

        if (!isValidPass) {
            return res.status(404).json({
                message: "Неверный логин или пароль2",
            });
        }

        const { password, ...userData } = candidate._doc;

        const accessToken = jwt.sign(
            { user: userData },
            process.env.SecretKey,
            {
                expiresIn: "1d", // Время жизни access токена (например, 15 минут)
            }
        );

        const refreshToken = jwt.sign(
            { user: userData },
            process.env.SecretKeyRefresh,
            {
                expiresIn: "30d", // Время жизни refresh токена (например, 30 дней)
            }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Убедись, что это включено в продакшене
            sameSite: "Strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // Время жизни cookies (30 дней)
        });

        res.json({ accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Не удалось авторизоваться",
        });
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        const user = jwt.verify(refreshToken, process.env.SecretKeyRefresh);
        const userData = user.user;

        const newAccessToken = jwt.sign(
            { user: userData },
            process.env.SecretKey,
            {
                expiresIn: "1d",
            }
        );

        const newRefreshToken = jwt.sign(
            { user: userData },
            process.env.SecretKeyRefresh,
            { expiresIn: "30d" }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Используйте secure в продакшене
            sameSite: "Strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Invalid refresh token" });
    }
};

export const getMe = async (req, res) => {
    try {
        const id = req.userId;

        const user = await User.findById(id);

        const { password, ...userData } = user._doc;

        res.json(userData);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const id = req.userId;
        const { password, newPassword } = req.body;

        const candidate = await User.findById(id);

        if (!candidate) {
            return res.json({
                success: false,
                message: "Не удалось найти пользователя",
            });
        }

        const isValidPass = await bcrypt.compare(password, candidate.password);

        if (!isValidPass) {
            return res.json({
                success: false,
                message: "Пароль введен не правильно",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        candidate.password = hash;

        await candidate.save();

        res.json({
            success: true,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const upload = async (req, res) => {
    try {
        const fileName = req.file.filename;
        const id = req.userId;
        const user = await User.findById(id);
        user.avatar = fileName;
        await user.save();
        res.json({
            success: true,
            message: "Изображение загружено",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const id = req.userId;
        const users = await User.find({ _id: { $ne: id } }).select("-password"); // Исключаем поле password из результатов
        res.json({ users });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
};

export const logOut = async (req, res) => {
    // const { refreshToken } = req.body;
    // try {
    //     await User.findOneAndDelete({ refreshToken }, { refreshToken: null });
    //     res.status(200).json({ message: "Вы вышли из системы" });
    // } catch (error) {
    //     return res.status(401).json({ message: "Неверный refresh токен" });
    // }
};
