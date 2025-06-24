import { createContext, useContext, ParentComponent } from 'solid-js';
import { createProjectStore, type ProjectStore } from './projectStore';
import { createTransportStore, type TransportStore } from './transportStore';
import { createViewStore, type ViewStore } from './viewStore';

interface DAWContext {
  project: ProjectStore;
  transport: TransportStore;
  view: ViewStore;
}

const DAWContext = createContext<DAWContext>();

export const DAWProvider: ParentComponent = (props) => {
  const project = createProjectStore();
  const transport = createTransportStore(() => project.project);
  const view = createViewStore();

  const contextValue: DAWContext = {
    project,
    transport,
    view,
  };

  return (
    <DAWContext.Provider value={contextValue}>
      {props.children}
    </DAWContext.Provider>
  );
};

export const useDAW = () => {
  const context = useContext(DAWContext);
  if (!context) {
    throw new Error('useDAW must be used within a DAWProvider');
  }
  return context;
};

export const useProject = () => useDAW().project;
export const useTransport = () => useDAW().transport;
export const useView = () => useDAW().view;