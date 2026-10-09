import './style.css';
import './navbar.css';

import { IPResolutionRecords } from './models/ip-resolution-records';
import { IPResolutionService } from './services/ip-resolution-service';
import { IPCheckerView } from './views/ip-checker-view';

const view = new IPCheckerView(document.querySelector<HTMLDivElement>('#app')!);
const resolutions = new IPResolutionRecords();

view.render();
view.showUserAgent();
view.showResolving();

const resolver = new IPResolutionService({
    onResolution: (resolution) => {
        resolutions.add(resolution);
        view.showIP(resolution.ip);
        view.showResolution(resolution);
    },
    onNotFound: (family) => view.showNotFound(family),
    onFetchFailure: (family) => view.showFetchFailure(family),
});

resolver.start();
