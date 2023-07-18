import root from 'react-shadow';
import miniprofileCSS from './assets/steam/shared_global.css'

function MiniprofileShadow({ miniprofile }: any) {
  return (
    <root.div className="miniprofile_wrapper">
      {miniprofile}
      <style type="text/css">{miniprofileCSS}</style>
    </root.div>
  );
}

export default MiniprofileShadow;