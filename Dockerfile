FROM node:22-alpine

ENV NODE_NO_WARNINGS 1
ENV user node
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

RUN mkdir /home/$user/app
COPY . /home/$user/app/
RUN chown -R $user: /home/$user/app

USER $user

RUN mkdir /home/$user/.npm-global

WORKDIR /home/$user/app
RUN npm ci && \
    npm run build && \
    npm -g install . --no-optional

ENTRYPOINT ["iexec"]
