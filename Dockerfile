FROM node:8.1.0-alpine

ENV user node
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global


RUN mkdir /home/$user/app
COPY . /home/$user/app/
RUN chown -R $user: /home/$user/app

USER $user

RUN mkdir /home/$user/.npm-global

WORKDIR /home/$user/app
RUN npm -g i

ENTRYPOINT ["iexec"]
