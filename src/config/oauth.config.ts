// src/config/oauth.config.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as GitHubStrategy } from 'passport-github2';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { AppDataSource } from './database.config';

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await AppDataSource.getRepository(User).findOne({
          where: { id: payload.sub },
          relations: ['roles', 'roles.permissions', 'company'],
        });

        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);

        // Check if user exists
        let user = await userRepo.findOne({
          where: { googleId: profile.id },
          relations: ['roles', 'company'],
        });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await userRepo.findOne({
          where: { email: profile.emails![0].value },
          relations: ['roles', 'company'],
        });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.isEmailVerified = true;
          await userRepo.save(user);
          return done(null, user);
        }

        // Create new user
        const memberRole = await roleRepo.findOne({
          where: { name: 'member' },
        });

        const newUser = userRepo.create({
          email: profile.emails![0].value,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          googleId: profile.id,
          isEmailVerified: true,
          roles: memberRole ? [memberRole] : [],
        });

        await userRepo.save(newUser);
        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// GitHub OAuth Strategy
// passport.use(new GitHubStrategy({
//     clientID: process.env.GITHUB_CLIENT_ID!,
//     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//     callbackURL: '/api/auth/github/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         const userRepo = AppDataSource.getRepository(User);
//         const roleRepo = AppDataSource.getRepository(Role);

//         let user = await userRepo.findOne({
//             where: { githubId: profile.id },
//             relations: ['roles', 'company']
//         });

//         if (user) {
//             return done(null, user);
//         }

//         // Check by email if available
//         if (profile.emails && profile.emails.length > 0) {
//             user = await userRepo.findOne({
//                 where: { email: profile.emails[0].value },
//                 relations: ['roles', 'company']
//             });

//             if (user) {
//                 user.githubId = profile.id;
//                 await userRepo.save(user);
//                 return done(null, user);
//             }
//         }

//         // Create new user
//         const memberRole = await roleRepo.findOne({ where: { name: 'member' } });

//         const newUser = userRepo.create({
//             email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
//             firstName: profile.displayName?.split(' ')[0] || profile.username || '',
//             lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
//             githubId: profile.id,
//             isEmailVerified: true,
//             roles: memberRole ? [memberRole] : []
//         });

//         await userRepo.save(newUser);
//         return done(null, newUser);
//     } catch (error) {
//         return done(error, null);
//     }
// }));

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.firstName + ' ' + user.lastName,
      name: user.firstName,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user as User);
  });
});
