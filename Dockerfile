FROM grafana/k6:latest

COPY ./scripts /scripts

WORKDIR /scripts

ENTRYPOINT ["k6", "run", "scenario.js"]
