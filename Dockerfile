FROM node:9.7.1-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python2 python2-dev py-setuptools dumb-init musl linux-headers build-base ca-certificates

ENV user node
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global


RUN mkdir /home/$user/app
COPY . /home/$user/app/
RUN chown -R $user: /home/$user/app

USER $user

RUN mkdir /home/$user/.npm-global

WORKDIR /home/$user/app
RUN npm -g i --no-optional

ENTRYPOINT ["iexec"]
